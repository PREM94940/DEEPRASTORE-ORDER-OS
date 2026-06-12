'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';

export async function fetchAllOrdersAction() {
  const orderService = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    const orders = await orderService.getAllOrders(tenantId);
    return {
      success: true,
      orders: orders.map((o: any) => ({
        id: o.id,
        customer: o.customerName || 'Unknown',
        phone: o.customerPhone || 'Unknown',
        source: o.source || 'Walk-in',
        type: o.orderType || 'READY',
        payment: o.paymentStatus || 'PENDING',
        status: o.status || 'DRAFT',
        expectedDelivery: o.expectedDeliveryDate ? o.expectedDeliveryDate.toISOString() : new Date().toISOString(),
      }))
    };
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return { success: false, error: error.message };
  }
}
