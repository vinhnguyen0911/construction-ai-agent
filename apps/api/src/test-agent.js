#!/usr/bin/env node

// Test script — chạy agent standalone để verify Gemini + function calling
// Usage: pnpm test:agent (hoặc node src/test-agent.js từ apps/api)

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

import { runAgent } from './agent/index.js';

const TEST_QUERIES = [
  'Thời tiết hôm nay ở Hồ Chí Minh thế nào?',
  'Dự báo thời tiết 3 ngày tới tại Biên Hòa, hôm nay có nên đổ bê tông không?',
];

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 TEST AGENT — Construction AI Agent');
  console.log('='.repeat(60));

  // Validate env
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Missing GEMINI_API_KEY in .env');
    process.exit(1);
  }
  if (!process.env.OPENWEATHER_API_KEY) {
    console.error('❌ Missing OPENWEATHER_API_KEY in .env');
    process.exit(1);
  }

  console.log('✅ API keys loaded\n');

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📝 Test ${i + 1}: "${query}"`);
    console.log('─'.repeat(60));

    try {
      const start = Date.now();
      const result = await runAgent(query);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      if (result.functionCalls.length > 0) {
        console.log(`\n🔧 Function calls (${result.functionCalls.length}):`);
        for (const fc of result.functionCalls) {
          console.log(`   - ${fc.name}(${JSON.stringify(fc.args)})`);
        }
      }

      console.log(`\n💬 Response:\n${result.text}`);
      console.log(`\n⏱️  Completed in ${elapsed}s`);
    } catch (err) {
      console.error(`\n❌ Error: ${err.message}`);
      if (err.message.includes('API_KEY')) {
        console.error('   → Check GEMINI_API_KEY in .env');
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 Test completed');
  console.log('='.repeat(60));
}

main();
