import { db } from '@deeprastore/infrastructure';
import { sql } from 'drizzle-orm';

async function verifyDb() {
  const oCount = await db.execute(sql`SELECT count(*) FROM orders`);
  const eCount = await db.execute(sql`SELECT count(*) FROM enquiries`);
  const cCount = await db.execute(sql`SELECT count(*) FROM customers`);

  console.log('--- DATABASE VERIFICATION ---');
  console.log(`Orders: ${oCount[0].count}`);
  console.log(`Enquiries: ${eCount[0].count}`);
  console.log(`Customers: ${cCount[0].count}`);
  console.log('-----------------------------');
  process.exit(0);
}

verifyDb();
