import { db } from './packages/infrastructure/src/index.ts';
import { orders } from './packages/infrastructure/src/schema/order.ts';
import { getPilotMetrics } from './apps/web/app/(staff)/actions/pilot.ts';
import { desc, eq } from "drizzle-orm";

async function run() {
  console.log('Testing /orders query...');
  try {
    const allOrders = await db
      .select({
        id: orders.id,
        businessId: orders.businessId,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        source: orders.source,
        orderCategory: orders.orderCategory,
        totalAmount: orders.totalAmount,
        balanceAmount: orders.balanceAmount,
        advanceAmount: orders.advanceAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        primaryImageUrl: orders.primaryImageUrl,
        trackingToken: orders.trackingToken,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.isDeleted, false))
      .orderBy(desc(orders.createdAt))
      .limit(100);
    console.log('Orders query success! Orders found:', allOrders.length);
  } catch (err) {
    console.error('Orders query failed:', err);
  }

  console.log('\nTesting /dashboard query (getPilotMetrics)...');
  try {
    const metrics = await getPilotMetrics();
    console.log('Dashboard query success!');
  } catch (err) {
    console.error('Dashboard query failed:', err);
  }
  
  process.exit(0);
}

run();
