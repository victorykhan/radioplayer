import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { AudioEngine } from './engine.js';
import logger from '../lib/logger.js';

const prisma = new PrismaClient();
const engine = new AudioEngine(prisma);

logger.info('=== Playout Engine Starting ===');

async function loop() {
  while (true) {
    try {
      await engine.playNext();
    } catch (err) {
      logger.error('Playout error', { error: err.message });
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

process.on('SIGINT', () => {
  logger.info('Playout stopping...');
  engine.stop();
  prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Playout stopping...');
  engine.stop();
  prisma.$disconnect();
  process.exit(0);
});

loop().catch((err) => {
  logger.error('Fatal playout error', { error: err.message });
  prisma.$disconnect();
  process.exit(1);
});
