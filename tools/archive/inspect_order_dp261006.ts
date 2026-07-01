import 'dotenv/config';
import { db } from '../packages/infrastructure/src/db/client';
import { orders } from '../packages/infrastructure/src/schema/order';
import { eq } from 'drizzle-orm';

async function inspect() {
  const result = await db.select().from(orders).where(eq(orders.businessId, 'DP261006'));
  console.log(JSON.stringify(result[0] || null, null, 2));
}

inspect().catch(console.error).finally(() => process.exit(0));
