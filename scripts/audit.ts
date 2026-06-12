import { db } from '../packages/infrastructure/src/db/client';
import { orders } from '../packages/infrastructure/src/schema/order';
import { eq, and } from 'drizzle-orm';
import { OrderRepository } from '../packages/infrastructure/src/repositories/OrderRepository';

async function run() {
  try {
    const repo = new OrderRepository();
    const tenantId = '11111111-1111-1111-1111-111111111111';
    
    // 1. Create fresh order and force CONFIRMED
    const order = await repo.createOrder(null, {
      tenantId,
      source: 'WHATSAPP',
      orderType: 'CUSTOM',
      totalAmount: 5000
    } as any);
    await db.update(orders).set({ paymentStatus: 'VERIFIED', status: 'CONFIRMED' }).where(eq(orders.id, order.id));
    
    console.log('--- 1. Exact Order ID ---');
    console.log(order.id);
    
    // 2. Raw row before transition
    let rawRow = await db.select().from(orders).where(eq(orders.id, order.id));
    console.log('\n--- 2. Raw database row before transition ---');
    console.log('Status:', rawRow[0].status, '| Payment:', rawRow[0].paymentStatus);
    
    // 3. Raw row after Start Stitching
    await repo.updateOrderProductionStatus(null, tenantId, order.id, 'STITCHING');
    rawRow = await db.select().from(orders).where(eq(orders.id, order.id));
    console.log('\n--- 3. Raw database row after Start Stitching ---');
    console.log('Status:', rawRow[0].status);
    
    // 4. Raw row after Mark Ready
    await repo.updateOrderProductionStatus(null, tenantId, order.id, 'READY');
    rawRow = await db.select().from(orders).where(eq(orders.id, order.id));
    console.log('\n--- 4. Raw database row after Mark Ready ---');
    console.log('Status:', rawRow[0].status);
    
    // 5. Query result from Production Queue
    const queue = await repo.getProductionQueue(tenantId);
    const foundInQueue = queue.some(o => o.id === order.id);
    console.log('\n--- 5. Query result from Production Queue after READY ---');
    console.log('Is order in queue?', foundInQueue);
    
    // 6. Orders Dashboard Ready filter simulation
    const dashboardQuery = await db.select().from(orders).where(and(eq(orders.tenantId, tenantId), eq(orders.status, 'READY')));
    const foundInDashboard = dashboardQuery.some(o => o.id === order.id);
    console.log('\n--- 6. Query result from Orders Dashboard Ready filter ---');
    console.log('Is order in ready filter?', foundInDashboard);
    
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
