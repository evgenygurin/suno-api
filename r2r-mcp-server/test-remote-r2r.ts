#!/usr/bin/env tsx
/**
 * Test script for remote R2R v3 server connection using official SDK
 */

import 'dotenv/config';
import {
  checkHealth,
  listCollections,
  listDocuments,
  searchDocuments,
} from './src/r2r-client-sdk.js';
import { createModuleLogger } from './src/logger.js';

const logger = createModuleLogger('test-remote');

async function testConnection() {
  console.log('\n🔌 Testing Remote R2R v3 Connection');
  console.log('=====================================\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Health Check...');
    const health = await checkHealth();
    console.log(`✅ Health: ${health.status} (${health.version})\n`);

    // 2. List Collections
    console.log('2️⃣ List Collections...');
    try {
      const collections = await listCollections();
      console.log(`✅ Found ${collections?.results?.length || 0} collections`);
      if (collections?.results?.length) {
        collections.results.slice(0, 3).forEach((col: any) => {
          console.log(`   - ${col.name || col.id}`);
        });
      }
      console.log();
    } catch (error: any) {
      console.log(`⚠️  Collections: ${error.message}\n`);
    }

    // 3. List Documents
    console.log('3️⃣ List Documents...');
    try {
      const docs = await listDocuments();
      console.log(`✅ Found ${docs?.results?.length || 0} documents`);
      if (docs?.results?.length) {
        docs.results.slice(0, 3).forEach((doc: any) => {
          console.log(`   - ${doc.title || doc.id}`);
        });
      }
      console.log();
    } catch (error: any) {
      console.log(`⚠️  Documents: ${error.message}\n`);
    }

    // 4. Test Search (if documents exist)
    console.log('4️⃣ Test Search...');
    try {
      const results = await searchDocuments('API', 3);
      console.log(`✅ Search completed: ${results?.results?.length || 0} results`);
      if (results?.results?.length) {
        results.results.forEach((result: any, i: number) => {
          console.log(`   ${i + 1}. Score: ${result.score?.toFixed(3) || 'N/A'}`);
        });
      }
      console.log();
    } catch (error: any) {
      console.log(`⚠️  Search: ${error.message}\n`);
    }

    console.log('✅ Connection test completed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Index your documentation: npm run ingest');
    console.log('   2. Test search: npm run cli search "CAPTCHA"');
    console.log('   3. Start MCP server: npm run dev\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Connection test failed:');
    console.error(`   ${error.message}`);
    console.error('\n🔍 Troubleshooting:');
    console.error('   - Check R2R server is running at', process.env.R2R_BASE_URL);
    console.error('   - Verify network connectivity');
    console.error('   - Check firewall settings\n');

    logger.error({ error }, 'Connection test failed');
    process.exit(1);
  }
}

testConnection();
