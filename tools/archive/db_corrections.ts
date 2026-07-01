import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new Client({
  connectionString,
});

async function runCorrections() {
  await client.connect();
  console.log("Connected to DB.");

  try {
    // Modify orders table for the 4 Engines
    await client.query(`
      ALTER TABLE public.orders 
        ALTER COLUMN payment_status SET DEFAULT 'UNPAID',
        ADD COLUMN IF NOT EXISTS production_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
        ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED';
    `);
    console.log("Updated orders table for 4 engines.");

    console.log("DB Corrections Phase B2 Complete.");
  } catch (error) {
    console.error("Error running DB corrections:", error);
  } finally {
    await client.end();
  }
}

runCorrections();
