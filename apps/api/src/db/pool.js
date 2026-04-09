import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.match(/localhost|127\.0\.0\.1|sslmode=disable/)
    ? false
    : { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export default pool;
