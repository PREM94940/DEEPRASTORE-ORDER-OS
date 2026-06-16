import { db } from './db';
import { orders } from './schema/orders';
import { sql } from 'drizzle-orm';

async function verify() {
  console.log('--- B. Pilot Dashboard Proof ---');
  const countRes = await db.select({ count: sql`count(*)` }).from(orders);
  console.log('Orders Count:', countRes[0].count);

  console.log('\n--- C. Command Center Proof ---');
  const statusRes = await db.select({
    status: orders.productionStatus,
    count: sql`count(*)`
  }).from(orders).groupBy(orders.productionStatus);
  console.log('Production Status Breakdown:', statusRes);
  
  process.exit(0);
}

verify().catch(console.error);
