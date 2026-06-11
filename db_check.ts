import { db } from './packages/infrastructure/src/db';
import { orders } from './packages/core-domain/src/schema';
import { desc } from 'drizzle-orm';

async function check() {
  const latestOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(1);
  console.log("Latest Order:");
  console.log(JSON.stringify(latestOrders, null, 2));
  process.exit(0);
}

check();
