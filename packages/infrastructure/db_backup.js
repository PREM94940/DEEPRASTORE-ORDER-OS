const { Client } = require('pg');
const dotenv = require('dotenv');
const { resolve } = require('path');
const fs = require('fs');

dotenv.config({ path: resolve(__dirname, '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  try {
    // 1. Get all table names in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    
    console.log('--- STARTING DATABASE BACKUP AND AUDIT ---');
    console.log(`Found ${tables.length} tables in public schema.`);

    const backupData = {};
    const rowCounts = {};

    for (const table of tables) {
      // Avoid backing up system views/indexes if any (though information_schema filters them)
      try {
        const dataRes = await client.query(`SELECT * FROM public."${table}"`);
        backupData[table] = dataRes.rows;
        rowCounts[table] = dataRes.rowCount;
        console.log(`Table "${table}": ${dataRes.rowCount} rows`);
      } catch (err) {
        console.error(`Error querying table ${table}:`, err.message);
      }
    }

    const backupPath = resolve(__dirname, '../../database_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`\n✅ Backup successfully written to ${backupPath}`);

    // 2. Audit customer records to check for real customer records
    console.log('\n--- CUSTOMER RECORD AUDIT ---');
    const customers = backupData['customers'] || [];
    if (customers.length === 0) {
      console.log('No customer records found.');
    } else {
      console.log(`Found ${customers.length} customer(s):`);
      customers.forEach((c, idx) => {
        console.log(`[Customer ${idx + 1}] Name: "${c.name}", Phone: "${c.phone}", Created At: ${c.created_at || c.createdAt}`);
      });
    }

    console.log('\n--- ORDER RECORD AUDIT ---');
    const orders = backupData['orders'] || [];
    if (orders.length === 0) {
      console.log('No order records found.');
    } else {
      console.log(`Found ${orders.length} order(s):`);
      orders.forEach((o, idx) => {
        console.log(`[Order ${idx + 1}] ID: ${o.id}, Customer Name: "${o.customer_name}", Phone: "${o.customer_phone}", Status: "${o.production_status}"`);
      });
    }

  } catch (err) {
    console.error('Backup failed:', err);
  } finally {
    await client.end();
  }
}

run();
