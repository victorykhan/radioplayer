import { Router } from 'express';
import { parseAudioFile, computeFileHash } from '../lib/id3.js';
import { upload } from '../lib/upload.js';
import logger from '../lib/logger.js';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const tracksDir = path.resolve(process.env.TRACKS_DIR || './storage/tracks');
fs.mkdirSync(tracksDir, { recursive: true });

export const trackRouter = Router();

function toStoredPath(fileHash, ext) {
  const subdir = fileHash.slice(0, 2);
  const dir = path.join(tracksDir, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(subdir, `${fileHash}${ext}`);
}

// Single track upload
trackRouter.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    const id3 = await parseAudioFile(filePath);
    const fileHash = await computeFileHash(filePath);

    const existing = await prisma.track.findUnique({ where: { fileHash } });
    if (existing) {
      fs.unlinkSync(filePath);
      return res.status(409).json({ error: 'Duplicate track', existing });
    }

    const storedPath = toStoredPath(fileHash, ext);
    const fullStoredPath = path.join(tracksDir, storedPath);
    fs.mkdirSync(path.dirname(fullStoredPath), { recursive: true });
    fs.renameSync(filePath, fullStoredPath);

    const track = await prisma.track.create({
      data: {
        title: id3.title || path.basename(req.file.originalname, ext),
        artist: id3.artist,
        album: id3.album,
        genre: id3.genre,
        year: id3.year,
        trackNumber: id3.trackNumber,
        composer: id3.composer,
        lyrics: id3.lyrics,
        duration: id3.duration,
        filePath: storedPath,
        fileName: req.file.originalname,
        fileHash,
        fileSize: req.file.size,
        mimeType: id3.mimeType,
        bitrate: id3.bitrate,
        sampleRate: id3.sampleRate,
        encoding: id3.encoding,
        type: req.body.type || 'song',
        status: req.body.status || 'active',
        isFallback: req.body.isFallback === 'true' || req.body.isFallback === true,
        uploadedBy: req.session?.adminUser?.id || null,
      },
    });

    logger.info(`Track uploaded: ${track.title}`, { id: track.id, fileHash });

    res.status(201).json(track);
  } catch (err) {
    logger.error('Track upload failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Bulk upload
trackRouter.post('/bulk', upload.array('audio', 50), async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: 'No audio files provided' });
  }

  const results = { success: 0, skipped: 0, errors: [] };

  for (const file of files) {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const id3 = await parseAudioFile(file.path);
      const fileHash = await computeFileHash(file.path);

      const existing = await prisma.track.findUnique({ where: { fileHash } });
      if (existing) {
        fs.unlinkSync(file.path);
        results.skipped++;
        continue;
      }

      const storedPath = toStoredPath(fileHash, ext);
      const fullStoredPath = path.join(tracksDir, storedPath);
      fs.mkdirSync(path.dirname(fullStoredPath), { recursive: true });
      fs.renameSync(file.path, fullStoredPath);

      await prisma.track.create({
        data: {
          title: id3.title || path.basename(file.originalname, ext),
          artist: id3.artist,
          album: id3.album,
          genre: id3.genre,
          year: id3.year,
          trackNumber: id3.trackNumber,
          composer: id3.composer,
          duration: id3.duration,
          filePath: storedPath,
          fileName: file.originalname,
          fileHash,
          fileSize: file.size,
          mimeType: id3.mimeType,
          bitrate: id3.bitrate,
          sampleRate: id3.sampleRate,
          encoding: id3.encoding,
          type: 'song',
          status: 'active',
          isFallback: false,
          uploadedBy: req.session?.adminUser?.id || null,
        },
      });

      results.success++;
    } catch (err) {
      results.errors.push(`${file.originalname}: ${err.message}`);
      try { fs.unlinkSync(file.path); } catch {}
    }
  }

  await prisma.activityLog.create({
    data: {
      logLevel: 'info',
      event: 'bulk_upload',
      description: `Bulk uploaded ${results.success} track(s), ${results.skipped} skipped`,
      causerType: 'App/User',
      causerId: req.session?.adminUser?.id || null,
      source: 'BulkUpload',
      ipAddress: req.ip,
    },
  });

  logger.info(`Bulk upload complete: ${results.success} ok, ${results.skipped} skipped`);

  res.json(results);
});
