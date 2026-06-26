import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import { createAdmin } from './admin/index.js';
import { trackRouter } from './api/tracks.js';
import { playoutRouter } from './api/playout.js';
import logger from './lib/logger.js';
import { getUploadHtml } from './admin/upload-page.js';
import bcrypt from 'bcrypt';
import fs from 'fs';

// Ensure storage dirs exist
fs.mkdirSync('./storage/logs', { recursive: true });
fs.mkdirSync('./storage/uploads', { recursive: true });
fs.mkdirSync('./storage/tracks', { recursive: true });

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session for admin auth
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: true,
  saveUninitialized: true,
  name: 'radioplay_admin',
}));

// Debug logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Public website ---
app.use('/', express.static('public'));

// --- API routes ---
app.use('/api/tracks', trackRouter);
app.use('/api', playoutRouter);

// --- AdminJS ---
const { admin, router: adminRouter } = createAdmin(prisma);

// Login page (GET)
app.get('/admin/login', async (req, res) => {
  const login = await admin.renderLogin({
    action: '/admin/login',
    errorMessage: null,
  });
  res.send(login);
});

// Login POST
app.post('/admin/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    const login = await admin.renderLogin({
      action: '/admin/login',
      errorMessage: 'invalidCredentials',
    });
    return res.status(400).send(login);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const login = await admin.renderLogin({
      action: '/admin/login',
      errorMessage: 'invalidCredentials',
    });
    return res.status(400).send(login);
  }
  req.session.adminUser = {
    email: user.email,
    name: user.name,
    role: user.role,
    id: user.id,
  };
  req.session.save(() => res.redirect('/admin'));
});

// Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Auth middleware for /admin resource/api routes (excludes login, logout, and static assets)
app.use('/admin', (req, res, next) => {
  const publicPaths = ['/login', '/logout'];
  if (publicPaths.includes(req.path)) return next();
  if (req.path.startsWith('/frontend/assets/')) return next();
  if (req.session?.adminUser) return next();
  return res.redirect('/admin/login');
});

app.get('/admin/upload', (req, res) => {
  res.send(getUploadHtml());
});

app.use('/admin', adminRouter);

// --- Error handler ---
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: err.message });
});

// --- Start ---
app.listen(PORT, () => {
  logger.info(`=== RadioPlay server started ===`);
  logger.info(`Admin panel: http://localhost:${PORT}/admin`);
  logger.info(`Health: http://localhost:${PORT}/health`);
  logger.info(`Now-playing: http://localhost:${PORT}/api/now-playing`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
