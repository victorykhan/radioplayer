import { Router } from 'express';

export const playoutRouter = Router();

let nowPlaying = null;

export function setNowPlaying(track) {
  nowPlaying = track;
}

playoutRouter.get('/now-playing', (req, res) => {
  if (nowPlaying) {
    res.json(nowPlaying);
  } else {
    res.json({ title: 'No track playing', artist: null });
  }
});

playoutRouter.get('/status', (req, res) => {
  res.json({
    uptime: process.uptime(),
    nowPlaying,
    memory: process.memoryUsage(),
  });
});
