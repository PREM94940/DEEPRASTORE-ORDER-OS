import { db } from '../packages/infrastructure/src/db/client';
import { orders } from '../packages/infrastructure/src/schema/order';
import { eq } from 'drizzle-orm';
import { OrderRepository } from '../packages/infrastructure/src/repositories/OrderRepository';

async function run() {
  try {
    const repo = new OrderRepository();
    const tenantId = '11111111-1111-1111-1111-111111111111';
    
    // create a confirmed order
    const order = await repo.createOrder(null, {
      tenantId,
      source: 'WHATSAPP',
      orderType: 'CUSTOM',
      totalAmount: 5000
    } as any);
    
    // forcefully update it to VERIFIED and CONFIRMED so it shows in queue
    await db.update(orders).set({ paymentStatus: 'VERIFIED', status: 'CONFIRMED' }).where(eq(orders.id, order.id));
    console.log('Created test order:', order.id);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
