import { Client } from 'pg';

const client = new Client({
  connectionString: "postgresql://postgres.nctwwfpqdlyqddjdhkrk:Prem%409494026218@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
});

async function run() {
  await client.connect();

  const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
  console.log("=== TABLES ===");
  console.table(tables.rows);

  const orders = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='orders'`);
  console.log("=== ORDERS COLUMNS ===");
  console.table(orders.rows);

  const enquiries = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='enquiries'`);
  console.log("=== ENQUIRIES COLUMNS ===");
  console.table(enquiries.rows);

  await client.end();
}

run().catch(console.error);
