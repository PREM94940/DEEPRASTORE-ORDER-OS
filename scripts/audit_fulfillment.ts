import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { OrderService } from '../packages/infrastructure/src/services/OrderService';
import { db } from '../packages/infrastructure/src/db/client';
import { orders } from '../packages/infrastructure/src/schema/order';
import { eq } from 'drizzle-orm';

async function run() {
  const service = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';
  
  console.log('--- WORKFLOW 1: READY -> DELIVERED ---');
  // Find a READY order
  const readyOrders = await db.select().from(orders).where(eq(orders.status, 'READY')).limit(1);
  if (readyOrders.length > 0) {
    const orderId = readyOrders[0].id;
    console.log(`[Before] Order ID: ${orderId} | Status: ${readyOrders[0].status}`);
    
    await service.updateOrderProductionStatus(tenantId, orderId, 'DELIVERED');
    
    const afterOrder = await service.getOrder(tenantId, orderId);
    console.log(`[After] Order ID: ${orderId} | Status: ${afterOrder?.status}`);
  } else {
    console.log('No READY orders found to test.');
  }

  console.log('\n--- WORKFLOW 2: EXCEPTION RESOLUTION ---');
  // Find an OPEN exception
  const openExceptions = await db.select().from(orders).where(eq(orders.exceptionStatus, 'OPEN')).limit(1);
  if (openExceptions.length > 0) {
    const orderId = openExceptions[0].id;
    console.log(`[Before] Order ID: ${orderId} | Exception Status: ${openExceptions[0].exceptionStatus}`);
    
    await service.resolveException(tenantId, orderId);
    
    const afterOrder = await service.getOrder(tenantId, orderId);
    console.log(`[After] Order ID: ${orderId} | Exception Status: ${afterOrder?.exceptionStatus}`);
  } else {
    console.log('No OPEN exceptions found. Creating a test exception...');
    // Create an exception
    const allOrders = await service.getAllOrders(tenantId);
    if (allOrders.length > 0) {
      const targetId = allOrders[0].id;
      await service.createSupportTicket(tenantId, targetId, 'DEFECT', 'Test defect', 'http://example.com/evidence');
      
      const beforeEx = await service.getOrder(tenantId, targetId);
      console.log(`[Before] Order ID: ${targetId} | Exception Status: ${beforeEx?.exceptionStatus}`);
      
      await service.resolveException(tenantId, targetId);
      
      const afterEx = await service.getOrder(tenantId, targetId);
      console.log(`[After] Order ID: ${targetId} | Exception Status: ${afterEx?.exceptionStatus}`);
    }
  }

  process.exit(0);
}

run().catch(console.error);
