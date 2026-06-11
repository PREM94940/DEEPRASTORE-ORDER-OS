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
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        expectedDeliveryDate: o.expectedDeliveryDate ? o.expectedDeliveryDate.toISOString() : null,
        verificationTime: o.verificationTime ? o.verificationTime.toISOString() : null,
      }))
    };
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return { success: false, error: error.message };
  }
}
