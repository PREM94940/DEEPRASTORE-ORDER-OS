import { db } from '../packages/infrastructure/src/db/client';
import { orders, payments } from '../packages/infrastructure/src/schema/order';
import { eq, and } from 'drizzle-orm';

async function fixAdvances() {
  const allOrders = await db.select().from(orders);
  
  for (const order of allOrders) {
    const orderPayments = await db.select().from(payments)
      .where(and(eq(payments.orderId, order.id), eq(payments.status, 'VERIFIED')));
      
    let totalVerified = 0;
    for (const p of orderPayments) {
      totalVerified += parseFloat(p.amount?.toString() || '0');
    }
    
    // We do NOT modify balanceAmount logic since it might be manually corrected, but wait, the balance is total - advance!
    const newBalance = Math.max(0, parseFloat(order.totalAmount?.toString() || '0') - totalVerified);
    
    console.log(`Fixing Order ${order.orderNumber}: Advance ${order.advanceAmount} -> ${totalVerified}, Balance ${order.balanceAmount} -> ${newBalance}`);
    
    await db.update(orders)
      .set({
        advanceAmount: totalVerified.toFixed(2),
        balanceAmount: newBalance.toFixed(2)
      })
      .where(eq(orders.id, order.id));
  }
}

fixAdvances().then(() => process.exit(0)).catch(console.error);
