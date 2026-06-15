import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Creating support_tickets table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "business_id" varchar(50) NOT NULL UNIQUE,
        "order_id" uuid,
        "customer_phone" varchar(20),
        "category" varchar(50) NOT NULL,
        "priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
        "status" varchar(20) DEFAULT 'OPEN' NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "assigned_staff" varchar(100),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "resolved_at" timestamp
      );
    `);

    // Add foreign key constraints if tables exist, but safe to ignore if they fail because maybe tables were created later
    try {
      await client.query(`
        ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
      `);
      await client.query(`
        ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_phone_customers_phone_fk" FOREIGN KEY ("customer_phone") REFERENCES "customers"("phone") ON DELETE no action ON UPDATE no action;
      `);
    } catch (e: any) {
      console.log('FKs might already exist or referenced tables not ready. Skipping FKs.', e.message);
    }

    console.log('Successfully created support_tickets table.');
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
