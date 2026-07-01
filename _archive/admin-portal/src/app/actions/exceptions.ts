'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';
import { revalidatePath } from 'next/cache';

export async function resolveExceptionAction(tenantId: string, orderId: string, formData?: FormData): Promise<void> {
  try {
    const service = new OrderService();
    await service.resolveException(tenantId, orderId);
    
    // Revalidate paths to instantly refresh UI
    revalidatePath('/exceptions');
  } catch (error: any) {
    console.error('Error resolving exception:', error);
    throw error;
  }
}
