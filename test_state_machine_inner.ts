import { OrderService } from './packages/infrastructure/src/services/OrderService';
import { db } from './packages/infrastructure/src/db/client';
import { orders } from './packages/infrastructure/src/schema/order';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

async function runStateMachine() {
  console.log("=== PHASE C: AUTOMATED STATE MACHINE VALIDATION ===");
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const orderService = new OrderService();
  
  // Create a new order to test state transitions
  const newOrder = await orderService.createOrder({
    tenantId,
    source: 'PORTAL',
    orderType: 'CUSTOM', // Let's use custom to test stitching flow
    paymentMethod: 'UPI',
    items: [],
    shippingAddress: {
      fullName: 'State Machine Test',
      phone: '9494026218',
      addressLine1: 'Test',
      city: 'Test',
      state: 'Test',
      postalCode: '123456',
      country: 'India'
    }
  });
  
  const orderId = newOrder.id;
  const staffId = 'master-ji-1';
  console.log(`\\n[1] Created Test Order ${orderId} in DRAFT state.`);
  
  let dbRecord = await db.select().from(orders).where(eq(orders.id, orderId));
  console.log(` -> DB Initial Status: ${dbRecord[0].status}, Payment Status: ${dbRecord[0].paymentStatus}`);

  console.log(`\\n[2] Transition to PAYMENT_PENDING (Upload UTR)`);
  await orderService.submitUTR(tenantId, orderId, "TEST-UTR-123");
  dbRecord = await db.select().from(orders).where(eq(orders.id, orderId));
  console.log(` -> DB Payment Status: ${dbRecord[0].paymentStatus}`);

  console.log(`\\n[3] Transition to VERIFIED (Staff verifies payment)`);
  await orderService.verifyPayment(tenantId, orderId, staffId);
  dbRecord = await db.select().from(orders).where(eq(orders.id, orderId));
  console.log(` -> DB Order Status: ${dbRecord[0].status}, Payment Status: ${dbRecord[0].paymentStatus}`);

  console.log(`\\n[4] Transition to STITCHING`);
  await orderService.updateOrderProductionStatus(tenantId, orderId, 'STITCHING');
  dbRecord = await db.select().from(orders).where(eq(orders.id, orderId));
  console.log(` -> DB Order Status: ${dbRecord[0].status}`);

  console.log(`\\n[5] Transition to READY`);
  await orderService.updateOrderProductionStatus(tenantId, orderId, 'READY');
  dbRecord = await db.select().from(orders).where(eq(orders.id, orderId));
  console.log(` -> DB Order Status: ${dbRecord[0].status}`);

  if (dbRecord[0].status === 'READY') {
    console.log(`\\n -> PASS: Full State Machine Traversal Successful!`);
  } else {
    console.log(`\\n -> FAIL: State Machine Transition Failed.`);
  }

  process.exit(0);
}

runStateMachine().catch(console.error);
