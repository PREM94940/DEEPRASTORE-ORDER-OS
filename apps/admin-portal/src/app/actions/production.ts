'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';
import { revalidatePath } from 'next/cache';

export async function advanceProductionStatusAction(orderId: string, newStatus: string) {
  const orderService = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    await orderService.updateOrderProductionStatus(tenantId, orderId, newStatus);
    revalidatePath('/production-queue');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to advance production status:', error);
    return { success: false, error: error.message };
  }
}
