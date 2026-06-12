'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';

export async function fetchCustomerOrdersAction(phone: string) {
  const orderService = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    const orders = await orderService.getOrdersByPhone(tenantId, phone);
    // Serialize dates for Client Component transfer
    return {
      success: true,
      orders: orders.map((o: any) => ({
        ...o,
        status: o.status || 'DRAFT',
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString(),
        expectedDeliveryDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString() : null,
        verificationTime: o.verificationTime ? new Date(o.verificationTime).toISOString() : null,
      }))
    };
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return { success: false, error: error.message };
  }
}
