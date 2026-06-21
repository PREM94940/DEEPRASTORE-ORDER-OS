import { config } from 'dotenv';
import { resolve } from 'path';

// Load env vars
config({ path: resolve(__dirname, '../../../.env') });

import { db } from '@deeprastore/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

// The founder will provide these emails before execution.
// We are hardcoding the expected list structure here so it can be easily updated.
const FINAL_STAFF = [
  { email: 'founder@deeprastore.com', role: 'FOUNDER', name: 'Founder' },
  // { email: 'staff1@deeprastore.com', role: 'STAFF', name: 'Staff 1' },
];

async function main() {
  console.log('⚠️  STARTING STAFF PROVISIONING...');

  if (FINAL_STAFF.length === 1 && FINAL_STAFF[0].email === 'founder@deeprastore.com') {
    console.warn('⚠️ WARNING: Using placeholder founder email. Ensure FINAL_STAFF array is updated before real execution.');
  }

  try {
    console.log('🔄 Clearing old test staff from approved_staff...');
    await db.execute(sql`TRUNCATE TABLE approved_staff CASCADE;`);

    console.log(`🔄 Inserting ${FINAL_STAFF.length} final staff accounts...`);
    
    for (const staff of FINAL_STAFF) {
      await db.execute(sql`
        INSERT INTO approved_staff (email, role, name) 
        VALUES (${staff.email}, ${staff.role}, ${staff.name})
      `);
      console.log(`  -> Added ${staff.email} as ${staff.role}`);
    }

    console.log('✅ Staff provisioning complete.');
  } catch (error) {
    console.error('❌ Error during staff provisioning:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
