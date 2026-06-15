const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE public.orders 
      ALTER COLUMN payment_status SET DEFAULT 'UNPAID',
      ADD COLUMN IF NOT EXISTS production_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
      ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED';
    `);
    console.log('Success - DB schema updated.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
