// No dotenv
import { OrderRepository } from '@deeprastore/infrastructure/src/repositories/OrderRepository';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { orders, customers } from '@deeprastore/infrastructure/src/schema/order';
import { sql, eq } from 'drizzle-orm';

const tenantId = '11111111-1111-1111-1111-111111111111';
const staffId = 'Automation_Test_Agent';

async function printDbState(orderId: string, label: string) {
  const o = await db.select().from(orders).where(eq(orders.id, orderId));
  console.log(`\n--- DB AFTER ${label} ---`);
  console.log(`production_status: ${o[0].productionStatus}`);
  console.log(`dispatch_status:   ${o[0].dispatchStatus}`);
  
  const audits = await db.execute(sql`SELECT action, old_data, new_data FROM audit_logs WHERE record_id = ${orderId} ORDER BY created_at DESC LIMIT 1`);
  if (audits && audits.length > 0) {
    console.log(`AUDIT ROW:`);
    console.log(JSON.stringify(audits[0], null, 2));
  } else {
    console.log(`AUDIT ROW: NONE`);
  }
}

async function runTest() {
  const repo = new OrderRepository();
  
  // 1. Setup Data
  const testPhone = '9999988888';
  await db.execute(sql`INSERT INTO customers (phone, name, tenant_id) VALUES (${testPhone}, 'Test Audit Customer', ${tenantId}) ON CONFLICT (phone) DO NOTHING`);
  await db.execute(sql`DELETE FROM orders WHERE customer_phone = ${testPhone}`);
  
  const insertRes = await db.execute(sql`INSERT INTO orders (customer_name, customer_phone, tenant_id, production_status, dispatch_status, payment_status, status) VALUES ('Test Audit Customer', ${testPhone}, ${tenantId}, 'MEASUREMENT_PENDING', 'NOT_STARTED', 'VERIFIED', 'CONFIRMED') RETURNING id`);
  const orderId = insertRes[0].id as string;
  
  console.log(`\n[ORDER CREATED] ID: ${orderId}`);
  await printDbState(orderId, 'INITIAL');

  // TEST 1: MEASUREMENT_PENDING -> CUTTING
  try {
    await repo.updateOrderProductionStatusWithAudit(null, tenantId, orderId, 'CUTTING', 'Drag and Drop', staffId);
    console.log(`\nTEST 1: MEASUREMENT_PENDING -> CUTTING`);
    console.log(`PASS`);
    await printDbState(orderId, 'CUTTING');
  } catch (e: any) {
    console.log(`\nTEST 1 FAILED: ${e.message}`);
  }

  // TEST 2: CUTTING -> STITCHING
  try {
    await repo.updateOrderProductionStatusWithAudit(null, tenantId, orderId, 'STITCHING', 'Drag and Drop', staffId);
    console.log(`\nTEST 2: CUTTING -> STITCHING`);
    console.log(`PASS`);
    await printDbState(orderId, 'STITCHING');
  } catch (e: any) {
    console.log(`\nTEST 2 FAILED: ${e.message}`);
  }

  // TEST 3 (Rollback Test): STITCHING -> HOLD
  try {
    await repo.updateOrderProductionStatusWithAudit(null, tenantId, orderId, 'HOLD', 'Fabric Delay', staffId);
    console.log(`\nTEST 3: STITCHING -> HOLD`);
    console.log(`PASS`);
    await printDbState(orderId, 'HOLD');
  } catch (e: any) {
    console.log(`\nTEST 3 FAILED: ${e.message}`);
  }

  // TEST 4 (Rollback Release): HOLD -> STITCHING
  try {
    await repo.updateOrderProductionStatusWithAudit(null, tenantId, orderId, 'STITCHING', 'Fabric Received', staffId);
    console.log(`\nTEST 4: HOLD -> STITCHING`);
    console.log(`PASS`);
    await printDbState(orderId, 'STITCHING');
  } catch (e: any) {
    console.log(`\nTEST 4 FAILED: ${e.message}`);
  }
  
  // Fast forward to READY for dispatch tests
  await db.execute(sql`UPDATE orders SET production_status = 'READY' WHERE id = ${orderId}`);

  // TEST 5: READY -> PACKING
  try {
    await repo.updateOrderDispatchStatusWithAudit(null, tenantId, orderId, 'PACKING', staffId);
    console.log(`\nTEST 5: READY -> PACKING`);
    console.log(`PASS`);
    await printDbState(orderId, 'PACKING');
  } catch (e: any) {
    console.log(`\nTEST 5 FAILED: ${e.message}`);
  }

  // TEST 6: PACKING -> DISPATCHED
  try {
    await repo.updateOrderDispatchStatusWithAudit(null, tenantId, orderId, 'DISPATCHED', staffId, { courierName: 'BlueDart', trackingId: 'BD123456789' });
    console.log(`\nTEST 6: PACKING -> DISPATCHED`);
    console.log(`PASS`);
    await printDbState(orderId, 'DISPATCHED');
  } catch (e: any) {
    console.log(`\nTEST 6 FAILED: ${e.message}`);
  }

  process.exit(0);
}

runTest().catch(console.error);
