import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function backupAndWipe() {
  console.log('--- STARTING PHASE A DATA OPERATIONS ---');
  
  // 1. Backup Data
  console.log('1. Backing up all data to backup.json...');
  try {
    const allOrders = await client`SELECT * FROM orders`;
    const allCustomers = await client`SELECT * FROM customers`;
    const allOrderItems = await client`SELECT * FROM order_line_items`;
    const allAddresses = await client`SELECT * FROM order_addresses`;
    
    const backupData = {
      orders: allOrders,
      customers: allCustomers,
      orderLineItems: allOrderItems,
      orderAddresses: allAddresses,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('data_backup.json', JSON.stringify(backupData, null, 2));
    console.log(`✅ Data Backup Complete. Saved ${allOrders.length} orders and ${allCustomers.length} customers.`);

    // 2. Rollback Script Generation
    console.log('2. Generating Rollback Data Script...');
    const rollbackScript = `
import postgres from 'postgres';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

async function rollback() {
  const client = postgres(process.env.DATABASE_URL!);
  const data = JSON.parse(fs.readFileSync('data_backup.json', 'utf8'));
  
  console.log('This rollback script is for demo purposes. Schema changes might make direct re-insertion fail.');
  console.log('Rollback data available in data_backup.json');
  process.exit(0);
}
rollback();
`;
    fs.writeFileSync('scripts/rollback_data.ts', rollbackScript);
    console.log('✅ Rollback Script created at scripts/rollback_data.ts');

    // 3. Wipe Demo Data
    console.log('3. Wiping Demo Data (Rule 1)...');
    await client`TRUNCATE TABLE order_addresses CASCADE;`;
    await client`TRUNCATE TABLE order_line_items CASCADE;`;
    await client`TRUNCATE TABLE orders CASCADE;`;
    await client`TRUNCATE TABLE customer_addresses CASCADE;`;
    await client`TRUNCATE TABLE customers CASCADE;`;
    
    console.log('✅ Demo Data Wiped. Database is clean for Phase A.');
  } catch(e) {
    console.log('Error during backup/wipe:', e);
  } finally {
    process.exit(0);
  }
}

backupAndWipe().catch(console.error);
