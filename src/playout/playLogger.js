export class PlayLogger {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async logPlay(track, source = 'auto') {
    return this.prisma.playLog.create({
      data: {
        trackId: track.id,
        trackTitle: track.title,
        trackArtist: track.artist,
        source,
        duration: track.duration,
      },
    });
  }
}
