import { db } from './packages/infrastructure/src/db/client';
import { orders, payments } from './packages/infrastructure/src/schema/order';

async function main() {
  const o = await db.select().from(orders).limit(5);
  console.log("Orders:", JSON.stringify(o.map(x => ({ id: x.id, customerName: x.customerName, advanceAmount: x.advanceAmount, totalAmount: x.totalAmount, balanceAmount: x.balanceAmount })), null, 2));
}
main().catch(console.error);
