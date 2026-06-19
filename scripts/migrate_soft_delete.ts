import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log("=== RUNNING SOFT-DELETE COLUMNS MIGRATION ===");
  try {
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL;`);
    console.log("✅ Added column 'is_deleted' to orders table.");

    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;`);
    console.log("✅ Added column 'deleted_at' to orders table.");

    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deleted_by" varchar(255);`);
    console.log("✅ Added column 'deleted_by' to orders table.");

    console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();
