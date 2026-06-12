'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';
import { revalidatePath } from 'next/cache';

export async function startStitching(tenantId: string, orderId: string, formData?: FormData): Promise<void> {
  try {
    const service = new OrderService();
    await service.updateOrderProductionStatus(tenantId, orderId, 'STITCHING');
    
    // Revalidate paths to instantly refresh UI
    revalidatePath('/production-queue');
    revalidatePath('/orders');
  } catch (error: any) {
    console.error('Error starting stitching:', error);
    throw error;
  }
}

export async function markReady(tenantId: string, orderId: string, formData?: FormData): Promise<void> {
  try {
    const service = new OrderService();
    await service.updateOrderProductionStatus(tenantId, orderId, 'READY');
    
    // Revalidate paths to instantly refresh UI
    revalidatePath('/production-queue');
    revalidatePath('/orders');
  } catch (error: any) {
    console.error('Error marking ready:', error);
    throw error;
  }
}
