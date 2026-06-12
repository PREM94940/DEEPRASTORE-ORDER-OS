'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { revalidatePath } from 'next/cache';

export async function createManualOrder(formData: {
  tenantId: string;
  customerName: string;
  customerPhone: string;
  source: string;
  paymentReceived: boolean;
  notes: string;
  items: Array<{ productVariantId: string; quantity: number }>;
  staffName: string;
}) {
  const { tenantId, customerName, customerPhone, source, paymentReceived, notes, items, staffName } = formData;

  if (!customerName || !customerName.trim()) {
    return { success: false, error: 'Customer Name is required for manual orders.' };
  }
  if (!customerPhone || !customerPhone.trim()) {
    return { success: false, error: 'Customer Phone is required for manual orders.' };
  }
  if (!items || items.length === 0) {
    return { success: false, error: 'At least one item is required.' };
  }

  try {
    const orderService = new OrderService();

    // The createOrder action enforces canonical phone normalization internally
    const order = await orderService.createOrder({
      tenantId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      source: source || 'STORE',
      orderType: 'READY',
      paymentMethod: 'MANUAL',
      items,
      shippingAddress: {
        fullName: customerName.trim(),
        phone: customerPhone.trim(),
        addressLine1: 'In-Store Pickup / Manual Entry',
        city: 'Local',
        state: 'Local',
        postalCode: '000000',
        country: 'India',
      }
    });

    if (notes && notes.trim()) {
      // Create a support ticket to hold the notes/references so they are visible on the order
      await orderService.createSupportTicket(
        tenantId,
        order.id,
        'MANUAL_ORDER_NOTES',
        notes.trim(),
        ''
      );
    }

    if (paymentReceived) {
      await orderService.verifyPayment(tenantId, order.id, staffName);
    }

    revalidatePath('/orders');
    revalidatePath('/production-queue');
    revalidatePath('/payments');

    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error('Failed to create manual order:', error);
    return { success: false, error: error.message || 'Failed to create manual order' };
  }
}
