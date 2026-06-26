import * as mm from 'music-metadata';
import fs from 'fs';
import crypto from 'crypto';

export async function parseAudioFile(filePath) {
  const metadata = await mm.parseFile(filePath, { duration: true });
  const common = metadata.common;
  const format = metadata.format;

  return {
    title: common.title || null,
    artist: common.artist || null,
    album: common.album || null,
    genre: common.genre?.[0] || null,
    year: common.year || null,
    trackNumber: common.track?.no || null,
    composer: common.composer?.[0] || null,
    lyrics: common.lyrics?.[0] || null,
    duration: format.duration || null,
    bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : null,
    sampleRate: format.sampleRate || null,
    encoding: format.container || null,
    mimeType: format.container
      ? `audio/${format.container}`
      : null,
  };
}

export async function computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (d) => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}
