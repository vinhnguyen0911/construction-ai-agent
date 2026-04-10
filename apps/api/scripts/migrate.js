#!/usr/bin/env node

// Standalone migration script for production use.
// Reads DATABASE_URL from env (no dotenv path hack — works on Railway).
// Usage: DATABASE_URL=... node scripts/migrate.js
//   or locally: node src/db/migrate.js (uses dotenv)

import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const migration = `
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model', 'function')),
  content TEXT,
  function_calls JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);
`;

async function migrate() {
  console.log('🔄 Running database migration...');
  try {
    await pool.query(migration);
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
