import { db } from './packages/infrastructure/src/db/client';
import { orders } from './packages/infrastructure/src/schema/order';
import { eq } from 'drizzle-orm';

async function runTest() {
  const targetId = "f07c2c5a-4679-4153-8881-1edc25fc47d0";
  const result = await db.select().from(orders).where(eq(orders.id, targetId));
  console.log("Order from DB:", JSON.stringify(result[0], null, 2));
  process.exit(0);
}

runTest().catch(console.error);
