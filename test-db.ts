import { db, client } from './packages/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const result = await db.execute(sql`SELECT current_database(), current_user;`);
    console.log('Connection successful:', result);
    
    // Check if orders table exists
    const tableCheck = await db.execute(sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'orders'
    );`);
    console.log('Orders table exists:', tableCheck);
    
    process.exit(0);
  } catch (error) {
    console.error('Connection or query failed:', error);
    process.exit(1);
  }
}

main();
