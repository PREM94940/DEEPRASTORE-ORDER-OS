import { db } from './packages/infrastructure/src/db';
import { orders } from './packages/infrastructure/src/schema/orders';

async function checkOrders() {
  const result = await db.select({
    id: orders.id,
    productionStatus: orders.productionStatus,
    tenantId: orders.tenantId
  }).from(orders).limit(5);
  
  console.log('Orders in DB:', result);
  process.exit(0);
}

checkOrders().catch(console.error);
