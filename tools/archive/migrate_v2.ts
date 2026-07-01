import { db } from '../packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  console.log('Running V2 manual migrations...');

  try {
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_number" varchar(50) UNIQUE;`);
    console.log('Added order_number to orders');

    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courier_name" varchar(255);`);
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_id" varchar(255);`);
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_url" varchar(1024);`);
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "dispatch_date" timestamp;`);
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_proof_url" varchar(1024);`);
    await db.execute(sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notes" varchar(2048);`);
    console.log('Added tracking fields to orders');

    await db.execute(sql`ALTER TABLE "order_line_items" ADD COLUMN IF NOT EXISTS "measurements" jsonb;`);
    console.log('Added measurements to order_line_items');

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
