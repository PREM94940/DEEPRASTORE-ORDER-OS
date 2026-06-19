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
      // 1. Update the order
      await tx.update(orders)
        .set({
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

    revalidatePath('/payments');
    revalidatePath('/command-center');
    revalidatePath('/');
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
    revalidatePath('/command-center');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reject payment:', error);
    return { success: false, error: error.message };
  }
}
