import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env' });

async function runQueries() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No DATABASE_URL found');
    process.exit(1);
  }
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log(`Connected to: ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

    const res1 = await client.query('SELECT COUNT(*) FROM enquiries;');
    console.log(`\nSELECT COUNT(*) FROM enquiries;\nCOUNT: ${res1.rows[0].count}`);

    const res2 = await client.query('SELECT COUNT(*) FROM orders;');
    console.log(`\nSELECT COUNT(*) FROM orders;\nCOUNT: ${res2.rows[0].count}`);

    const res3 = await client.query('SELECT COUNT(*) FROM customers;');
    console.log(`\nSELECT COUNT(*) FROM customers;\nCOUNT: ${res3.rows[0].count}`);

    const res4 = await client.query('SELECT status, COUNT(*) FROM orders GROUP BY status;');
    console.log('\nSELECT status, COUNT(*) FROM orders GROUP BY status;');
    console.table(res4.rows);

    const res5 = await client.query('SELECT id, business_id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 20;');
    console.log('\nSELECT id, business_id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 20;');
    console.table(res5.rows);

    const res6 = await client.query('SELECT id, name, status, created_at FROM enquiries ORDER BY created_at DESC LIMIT 20;');
    console.log('\nSELECT id, name, status, created_at FROM enquiries ORDER BY created_at DESC LIMIT 20;');
    console.table(res6.rows);

  } catch (err) {
    console.error('Error running queries:', err);
  } finally {
    await client.end();
  }
}

runQueries();
