import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars
config({ path: resolve(__dirname, '../../../.env') });

import { db } from '@deeprastore/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('⚠️  STARTING PILOT DATABASE WIPE...');

  try {
    console.log('🔄 Truncating core operational tables...');
    await db.execute(sql`
      TRUNCATE TABLE 
        orders,
        order_line_items,
        order_addresses,
        payments,
        enquiries,
        enquiry_quotes,
        enquiry_comments,
        customers,
        customer_addresses,
        customer_notes,
        measurements_history,
        audit_logs,
        system_alerts,
        exceptions,
        notification_queue,
        otp_verifications,
        customer_audit_logs
      CASCADE;
    `);
    console.log('✅ Core operational tables truncated.');

    console.log('🔄 Resetting business_id_seq to 1000...');
    try {
      await db.execute(sql`TRUNCATE TABLE business_id_seq CASCADE;`);
      await db.execute(sql`INSERT INTO business_id_seq (id) VALUES (999);`);
      console.log('✅ Sequence reset to 1000.');
    } catch (e) {
      console.log('⚠️ Could not reset business_id_seq (it might not exist). Continuing...');
    }

    console.log('🚀 PILOT WIPE SCRIPT PREPARED SUCCESSFULLY.');
  } catch (error) {
    console.error('❌ Error during pilot wipe:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
