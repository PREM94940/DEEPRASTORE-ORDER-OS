'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';
import { revalidatePath } from 'next/cache';

export async function verifyPaymentAction(orderId: string, staffName: string) {
  const orderService = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    await orderService.verifyPayment(tenantId, orderId, staffName);
    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to verify payment:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectPaymentAction(orderId: string) {
  const orderService = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    await orderService.rejectPayment(tenantId, orderId);
    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reject payment:', error);
    return { success: false, error: error.message };
  }
}
