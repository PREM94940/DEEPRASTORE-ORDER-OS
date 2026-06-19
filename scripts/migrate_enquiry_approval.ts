import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("=== RUNNING ENQUIRY APPROVAL SCHEMAS MIGRATION ===");
  try {
    // 1. Create enquiry_quotes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "enquiry_quotes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "enquiry_id" uuid NOT NULL REFERENCES "enquiries"("id") ON DELETE CASCADE,
        "version" integer NOT NULL,
        "quote_amount" numeric(10, 2) NOT NULL,
        "required_advance" numeric(10, 2) NOT NULL,
        "quote_notes" varchar(2048),
        "invoice_url" varchar(1024),
        "expires_at" timestamp,
        "created_by" varchar(255),
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ Created 'enquiry_quotes' table.");

    // 2. Alter enquiries table to add current_quote_id
    await db.execute(sql`
      ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "current_quote_id" uuid;
    `);
    console.log("✅ Added column 'current_quote_id' to enquiries table.");

    console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
