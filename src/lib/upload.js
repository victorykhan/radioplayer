import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './storage/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIMES = [
  'audio/mpeg', 'audio/mp3',
  'audio/wav', 'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
  'audio/mp4', 'audio/x-m4a', 'audio/m4a',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000', 10) },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_MIMES.includes(file.mimetype));
  },
});

export { uploadDir };
