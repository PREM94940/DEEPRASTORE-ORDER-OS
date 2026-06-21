import { config } from 'dotenv';
import { resolve } from 'path';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { orders } from '@deeprastore/infrastructure/src/schema';
import { eq } from 'drizzle-orm';

config({ path: resolve(__dirname, '../../../.env') });

async function fixOrder() {
  try {
    const orderNumber = 'DP-2026-000064';
    console.log(`Fixing balance for ${orderNumber}...`);
    
    // Fetch order
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    if (!order) {
      console.log('Order not found!');
      process.exit(1);
    }

    const total = parseFloat(order.totalAmount?.toString() || '0');
    
    await db.update(orders)
      .set({
        advanceAmount: total.toFixed(2),
        balanceAmount: '0.00',
        paymentStatus: 'VERIFIED',
        updatedAt: new Date()
      })
      .where(eq(orders.orderNumber, orderNumber));

    console.log(`SUCCESS! Fixed balance for ${orderNumber}. Advance=${total}, Balance=0`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing order:', error);
    process.exit(1);
  }
}

fixOrder();
