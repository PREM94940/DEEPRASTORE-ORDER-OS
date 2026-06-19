import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("=== RUNNING COMMENTS AND QUOTE AUDIT MIGRATION ===");
  try {
    // 1. Create enquiry_comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "enquiry_comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "enquiry_id" uuid NOT NULL REFERENCES "enquiries"("id") ON DELETE CASCADE,
        "staff_name" varchar(255) NOT NULL,
        "comment" varchar(2048) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ Created 'enquiry_comments' table.");

    // 2. Add audit trail columns to enquiry_quotes table
    await db.execute(sql`
      ALTER TABLE "enquiry_quotes" ADD COLUMN IF NOT EXISTS "status_snapshot" varchar(50);
    `);
    console.log("✅ Added column 'status_snapshot' to enquiry_quotes.");

    await db.execute(sql`
      ALTER TABLE "enquiry_quotes" ADD COLUMN IF NOT EXISTS "created_from_status" varchar(50);
    `);
    console.log("✅ Added column 'created_from_status' to enquiry_quotes.");

    console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
