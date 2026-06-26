import winston from 'winston';
import 'dotenv/config';

const dev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: dev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    dev
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
            return `${timestamp} ${level}: ${message}${extra}`;
          })
        )
      : winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'storage/logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'storage/logs/combined.log' }),
  ],
});

export default logger;
