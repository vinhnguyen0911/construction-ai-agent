import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import reportRoutes from './routes/reports.js';
import { startDailyReportCron } from './scheduler/daily-report.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/reports', reportRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  startDailyReportCron();
});
