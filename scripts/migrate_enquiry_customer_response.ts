import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("=== RUNNING ENQUIRY CUSTOMER RESPONSE COLUMNS MIGRATION ===");
  try {
    await db.execute(sql`
      ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "customer_response" varchar(50);
    `);
    console.log("✅ Added column 'customer_response' to enquiries table.");

    await db.execute(sql`
      ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "customer_response_notes" varchar(2048);
    `);
    console.log("✅ Added column 'customer_response_notes' to enquiries table.");

    console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
