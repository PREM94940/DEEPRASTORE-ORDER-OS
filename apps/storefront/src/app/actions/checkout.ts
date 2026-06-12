'use server';

import { normalizePhone } from '../../../../../packages/core-domain/src/utils/phone';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';

export async function createOrderDraft(formData: {
  sku: string;
  price: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: string;
}) {
  const orderService = new OrderService();
  
  // Hardcoded tenant ID for now
  const tenantId = '11111111-1111-1111-1111-111111111111';
  
  try {
    const order = await orderService.createOrder({
      tenantId,
      source: 'PORTAL',
      orderType: 'READY',
      paymentMethod: formData.paymentMethod.toUpperCase(),
      items: [
        { productVariantId: formData.sku, quantity: 1 }
      ],
      shippingAddress: {
        fullName: formData.name,
        phone: normalizePhone(formData.phone),
        addressLine1: formData.address,
        city: formData.city,
        state: 'N/A',
        postalCode: formData.pincode,
        country: 'India'
      }
    });
    if (!order) {
      throw new Error('Failed to create order record');
    }
    
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error('Failed to create order:', error);
    return { success: false, error: error.message };
  }
}
