import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import path from 'path';
import logger from '../lib/logger.js';
import { setNowPlaying } from '../api/playout.js';
import { QueueCompiler } from './queue.js';
import { PlayLogger } from './playLogger.js';

const tracksDir = path.resolve(process.env.TRACKS_DIR || './storage/tracks');

export class AudioEngine {
  constructor(prisma) {
    this.prisma = prisma;
    this.queue = new QueueCompiler(prisma);
    this.logger = new PlayLogger(prisma);
    this.currentProcess = null;
    this.isPlaying = false;
    this.nextTrack = null;
  }

  async getTrackPath(track) {
    return path.join(tracksDir, track.filePath);
  }

  play(track) {
    return new Promise((resolve, reject) => {
      const trackPath = path.join(tracksDir, track.filePath);

      if (!require('fs').existsSync(trackPath)) {
        reject(new Error(`Track file not found: ${trackPath}`));
        return;
      }

      // Decode to WAV PCM for Icecast source
      this.currentProcess = spawn('ffmpeg', [
        '-i', trackPath,
        '-f', 'wav',
        '-acodec', 'pcm_s16le',
        '-ar', '44100',
        '-ac', '2',
        'pipe:1',
      ], { stdio: ['ignore', 'pipe', 'pipe'] });

      const startTime = Date.now();

      this.currentProcess.stdout.on('data', (chunk) => {
        // Audio data — pipe to Icecast client
        if (this.onAudioData) {
          this.onAudioData(chunk);
        }
      });

      this.currentProcess.on('close', (code) => {
        const playedDuration = (Date.now() - startTime) / 1000;
        this.isPlaying = false;
        resolve({ track, playedDuration, exitCode: code });
      });

      this.currentProcess.on('error', (err) => {
        this.isPlaying = false;
        reject(err);
      });

      this.isPlaying = true;
      setNowPlaying({
        id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        startedAt: new Date().toISOString(),
      });
    });
  }

  stop() {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.currentProcess = null;
      this.isPlaying = false;
    }
  }

  async playNext() {
    const track = this.nextTrack || await this.queue.next();
    this.nextTrack = null;

    if (!track) {
      logger.warn('No track available in queue, falling back to random');
      const random = await this.prisma.track.findFirst({
        where: { status: 'active', deletedAt: null },
        orderBy: { lastPlayedAt: 'asc' },
      });
      if (!random) {
        logger.error('No tracks available at all');
        return;
      }
      return this.play(random);
    }

    // Pre-fetch next track while current plays
    this.queue.next().then((t) => { this.nextTrack = t; }).catch(() => {});

    const result = await this.play(track);
    await this.logger.logPlay(track, 'auto');
    await this.prisma.track.update({
      where: { id: track.id },
      data: { playCount: { increment: 1 }, lastPlayedAt: new Date() },
    });

    return result;
  }
}
