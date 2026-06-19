import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  console.log("=== RUNNING ENQUIRY FIELDS & TRACKING TOKEN MIGRATION ===");
  try {
    // 1. Alter enquiries table
    await db.execute(sql`ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "enquiry_number" varchar(50);`);
    console.log("✅ Added column 'enquiry_number' to enquiries table.");

    await db.execute(sql`ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "email" varchar(255);`);
    console.log("✅ Added column 'email' to enquiries table.");

    await db.execute(sql`ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "address" varchar(1024);`);
    console.log("✅ Added column 'address' to enquiries table.");

    await db.execute(sql`ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "advance_payment_proof_url" varchar(1024);`);
    console.log("✅ Added column 'advance_payment_proof_url' to enquiries table.");

    await db.execute(sql`ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "tracking_token" varchar(100);`);
    console.log("✅ Added column 'tracking_token' to enquiries table.");

    await db.execute(sql`ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "assigned_to" varchar(255);`);
    console.log("✅ Added column 'assigned_to' to enquiries table.");

    // 2. Alter orders table
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_token" varchar(100);`);
    console.log("✅ Added column 'tracking_token' to orders table.");

    // 3. Create sequence for enquiries
    await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS "enquiry_number_seq" START 1;`);
    console.log("✅ Created sequence 'enquiry_number_seq'.");

    // 4. Backfill tracking tokens for existing enquiries
    const enquiriesWithoutToken = await db.execute(sql`SELECT id FROM enquiries WHERE tracking_token IS NULL;`);
    const enquiryRows = enquiriesWithoutToken.rows || enquiriesWithoutToken;
    console.log(`Backfilling tracking tokens for ${enquiryRows.length} enquiries...`);
    for (const row of enquiryRows) {
      const token = uuidv4();
      await db.execute(sql`UPDATE enquiries SET tracking_token = ${token} WHERE id = ${row.id};`);
    }
    console.log("✅ Backfilled enquiries.");

    // 5. Backfill tracking tokens for existing orders
    const ordersWithoutToken = await db.execute(sql`SELECT id FROM orders WHERE tracking_token IS NULL;`);
    const orderRows = ordersWithoutToken.rows || ordersWithoutToken;
    console.log(`Backfilling tracking tokens for ${orderRows.length} orders...`);
    for (const row of orderRows) {
      const token = uuidv4();
      await db.execute(sql`UPDATE orders SET tracking_token = ${token} WHERE id = ${row.id};`);
    }
    console.log("✅ Backfilled orders.");

    console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
