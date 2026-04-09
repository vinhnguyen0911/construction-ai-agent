import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool.js';
import { runAgent } from '../agent/index.js';
import { REPORT_LOCATIONS, REPORT_CRON_SCHEDULE, REPORT_TIMEZONE } from '@construction/shared';

/**
 * Generate daily weather reports for all locations.
 * @param {string[]} [locations] - Override list of locations
 * @returns {Promise<Array<{ location, success, error? }>>}
 */
export async function generateDailyReport(locations) {
  const targets = locations || REPORT_LOCATIONS;
  const today = new Date().toISOString().split('T')[0];
  const results = [];

  for (const location of targets) {
    console.log(`📋 Generating report for ${location}...`);
    try {
      const prompt = `Tạo BÁO CÁO THỜI TIẾT THI CÔNG cho ${location} ngày hôm nay (${today}).
Lấy thời tiết hiện tại và dự báo 3 ngày tới, sau đó đưa ra khuyến nghị thi công chi tiết.`;

      const result = await runAgent(prompt);

      await pool.query(
        'INSERT INTO daily_reports (id, location, report_date, content) VALUES ($1, $2, $3, $4)',
        [uuidv4(), location, today, result.text]
      );

      console.log(`✅ Report for ${location} saved`);
      results.push({ location, success: true });
    } catch (err) {
      console.error(`❌ Report for ${location} failed:`, err.message);
      results.push({ location, success: false, error: err.message });
    }
  }

  return results;
}

/**
 * Start cron job for daily report generation.
 * Schedule: 7:00 AM Asia/Ho_Chi_Minh
 */
export function startDailyReportCron() {
  cron.schedule(
    REPORT_CRON_SCHEDULE,
    async () => {
      console.log('⏰ Daily report cron triggered');
      await generateDailyReport();
    },
    { timezone: REPORT_TIMEZONE }
  );
  console.log(`📅 Daily report cron scheduled: ${REPORT_CRON_SCHEDULE} (${REPORT_TIMEZONE})`);
}
