import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { generateDailyReport } from '../scheduler/daily-report.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/reports
 * Query params: ?date=2024-01-15&location=Ho Chi Minh City
 * Trả về danh sách reports, mới nhất trước.
 */
router.get('/', async (req, res) => {
  try {
    const { date, location } = req.query;
    let query = 'SELECT * FROM daily_reports';
    const params = [];
    const conditions = [];

    if (date) {
      params.push(date);
      conditions.push(`report_date = $${params.length}`);
    }
    if (location) {
      params.push(location);
      conditions.push(`location = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY report_date DESC, created_at DESC LIMIT 100';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching reports:', err.message);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * POST /api/reports/run
 * Trigger thủ công tạo báo cáo cho tất cả locations.
 * Body (optional): { locations: ["Ho Chi Minh City"] }
 */
router.post('/run', async (req, res) => {
  try {
    const results = await generateDailyReport(req.body?.locations);
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error running report:', err.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;
