'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';

export async function submitUtrAction(formData: { orderId: string; utrNumber: string }) {
  const orderService = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    await orderService.submitUTR(tenantId, formData.orderId, formData.utrNumber);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to submit UTR:', error);
    return { success: false, error: error.message };
  }
}
