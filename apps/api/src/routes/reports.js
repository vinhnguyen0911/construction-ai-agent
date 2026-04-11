import { Router } from 'express';
import pool from '../db/pool.js';
import { authenticate } from '../middleware/auth.js';
import { generateDailyReport } from '../scheduler/daily-report.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/reports
 * Query params: ?date=2024-01-15&location=Ho Chi Minh City
 * Returns list of reports, newest first.
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
 * Manually trigger report generation for all locations.
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

/**
 * DELETE /api/reports/:id
 * Delete a single report by id.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM daily_reports WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('Error deleting report:', err.message);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
