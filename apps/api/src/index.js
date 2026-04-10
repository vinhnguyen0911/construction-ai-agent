import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import reportRoutes from './routes/reports.js';
import { startDailyReportCron } from './scheduler/daily-report.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — allow FRONTEND_URL + localhost for dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0
      ? (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
          cb(null, false);
        }
      : true,
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/reports', reportRoutes);

// Start
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  startDailyReportCron();
});
