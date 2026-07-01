import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function dropAll() {
  console.log('--- DROPPING ALL PUBLIC TABLES ---');
  try {
    await client`DROP TABLE IF EXISTS order_addresses CASCADE;`;
    await client`DROP TABLE IF EXISTS order_line_items CASCADE;`;
    await client`DROP TABLE IF EXISTS orders CASCADE;`;
    await client`DROP TABLE IF EXISTS customer_addresses CASCADE;`;
    await client`DROP TABLE IF EXISTS customer_notes CASCADE;`;
    await client`DROP TABLE IF EXISTS communication_logs CASCADE;`;
    await client`DROP TABLE IF EXISTS customers CASCADE;`;
    await client`DROP TABLE IF EXISTS leads CASCADE;`;
    await client`DROP TABLE IF EXISTS shopify_products_cache CASCADE;`;
    await client`DROP TABLE IF EXISTS approved_staff CASCADE;`;
    await client`DROP TABLE IF EXISTS audit_logs CASCADE;`;
    await client`DROP TABLE IF EXISTS business_id_seq CASCADE;`;
    console.log('✅ Dropped tables.');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
dropAll();
