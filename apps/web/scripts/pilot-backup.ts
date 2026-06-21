import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

// Load env vars
config({ path: resolve(__dirname, '../../../.env') });

const TABLES_TO_BACKUP = [
  'orders', 'order_line_items', 'order_addresses', 'payments',
  'enquiries', 'enquiry_quotes', 'enquiry_comments',
  'customers', 'customer_addresses', 'customer_notes', 'measurements_history',
  'audit_logs', 'system_alerts', 'exceptions', 'notification_queue',
  'otp_verifications', 'customer_audit_logs', 'business_id_seq'
];

async function main() {
  console.log('⚠️  STARTING PILOT DATABASE JSON BACKUP...');

  const backupDir = resolve(__dirname, 'backups');
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = resolve(backupDir, `pre_pilot_snapshot_${timestamp}.json`);

  try {
    const backupData: Record<string, any[]> = {};
    let totalRows = 0;

    for (const table of TABLES_TO_BACKUP) {
      console.log(`🔄 Exporting ${table}...`);
      try {
        const result = await db.execute(sql.raw(`SELECT * FROM ${table}`));
        backupData[table] = (result as any).rows || result;
        totalRows += backupData[table].length;
      } catch (e: any) {
        if (e.message.includes('does not exist')) {
          console.log(`⚠️ Table ${table} does not exist, skipping.`);
        } else {
          throw e;
        }
      }
    }

    console.log(`💾 Writing ${totalRows} total rows to ${backupFile}...`);
    writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    const stats = require('fs').statSync(backupFile);
    console.log(`✅ Backup successfully saved! Size: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Error during backup:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
