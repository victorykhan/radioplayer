import logger from '../lib/logger.js';

export class QueueCompiler {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async next() {
    // 1. Try scheduled/rotation playlists
    const playlist = await this.prisma.playlist.findFirst({
      where: { isActive: true, type: 'rotation' },
      include: {
        tracks: {
          include: { track: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (playlist?.tracks?.length) {
      const entry = playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];
      if (entry.track && entry.track.status === 'active' && !entry.track.deletedAt) {
        return entry.track;
      }
    }

    // 2. Try fallback pool
    const fallbackItem = await this.prisma.fallbackPoolItem.findFirst({
      where: { isActive: true },
      include: { track: true },
      orderBy: { priority: 'desc' },
    });

    if (fallbackItem?.track && fallbackItem.track.status === 'active' && !fallbackItem.track.deletedAt) {
      return fallbackItem.track;
    }

    // 3. Random active track
    const random = await this.prisma.track.findFirst({
      where: { status: 'active', deletedAt: null },
      orderBy: { lastPlayedAt: 'asc' },
    });

    return random || null;
  }
}
