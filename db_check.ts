import { config } from 'dotenv';
config();
import { db } from './packages/infrastructure/src/db/client';
import { orders } from './packages/infrastructure/src/schema/order';
import { eq } from 'drizzle-orm';

async function check() {
  const orderId = 'e7dd27f5-d750-490b-ada5-452ef5408925';
  const result = await db.select().from(orders).where(eq(orders.id, orderId));
  console.log("DB RESULT:", result);
  process.exit(0);
}

check().catch(console.error);
