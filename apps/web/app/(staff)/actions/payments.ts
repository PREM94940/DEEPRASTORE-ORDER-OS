'use server';

import { db } from '@deeprastore/infrastructure';
import { orders, payments } from '@deeprastore/infrastructure/src/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

import { requireStaffAuth } from './auth';

export async function approvePaymentAction(orderId: string, paymentId: string, staffName: string) {
  try {
    await requireStaffAuth();
    await db.transaction(async (tx) => {
      // Fetch current payment and order
      const [payment] = await tx.select().from(payments).where(eq(payments.id, paymentId));
      if (!payment) throw new Error("Payment not found");
      
      const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
      if (!order) throw new Error("Order not found");

      const paymentAmount = parseFloat(payment.amount?.toString() || "0");
      const currentAdvance = parseFloat(order.advanceAmount?.toString() || "0");
      const currentBalance = parseFloat(order.balanceAmount?.toString() || "0");

      const newAdvance = (currentAdvance + paymentAmount).toFixed(2);
      const newBalance = Math.max(0, currentBalance - paymentAmount).toFixed(2);

      // 1. Update the order
      await tx.update(orders)
        .set({
          advanceAmount: newAdvance,
          balanceAmount: newBalance,
          paymentStatus: 'VERIFIED',
          status: 'CONFIRMED',
          verificationStaff: staffName,
          verificationTime: new Date(),
          updatedAt: new Date()
        })
        .where(and(eq(orders.id, orderId), eq(orders.tenantId, MOCK_TENANT_ID)));

      // 2. Update the specific payment record
      await tx.update(payments)
        .set({
          status: 'VERIFIED',
          verifiedBy: staffName,
          verifiedAt: new Date()
        })
        .where(eq(payments.id, paymentId));
    });

    // Only revalidate paths that directly show payment data
    // Avoid revalidating '/' (dashboard) here — it triggers heavy getPilotMetrics queries
    // and can cause Vercel function timeouts, making the UI appear frozen
    revalidatePath('/payments');
    revalidatePath('/orders');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to approve payment:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectPaymentAction(orderId: string, paymentId: string, staffName: string) {
  try {
    await requireStaffAuth();
    await db.transaction(async (tx) => {
      // 1. Update the order
      await tx.update(orders)
        .set({
          paymentStatus: 'REJECTED',
          status: 'PAYMENT_REJECTED',
          updatedAt: new Date()
        })
        .where(and(eq(orders.id, orderId), eq(orders.tenantId, MOCK_TENANT_ID)));

      // 2. Update the specific payment record
      await tx.update(payments)
        .set({
          status: 'REJECTED',
          verifiedBy: staffName,
          verifiedAt: new Date()
        })
        .where(eq(payments.id, paymentId));
    });

    revalidatePath('/payments');
    revalidatePath('/orders');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reject payment:', error);
    return { success: false, error: error.message };
  }
}
