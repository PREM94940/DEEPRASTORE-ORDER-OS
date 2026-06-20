import { db } from "../packages/infrastructure/src/db/client";
import { orders } from "../packages/infrastructure/src/schema";
import { eq } from "drizzle-orm";

async function check() {
  const order = await db.select().from(orders).where(eq(orders.businessId, 'DP261002'));
  console.log(order);
}
check().catch(console.error);
