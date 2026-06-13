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
        orderNumber: o.orderNumber || o.id.split('-')[0].toUpperCase(),
        customer: o.customerName || 'Unknown',
        phone: o.customerPhone || 'Unknown',
        source: o.source || 'Walk-in',
        type: o.orderType || 'READY',
        payment: o.paymentStatus || 'PENDING',
        status: o.status || 'DRAFT',
        expectedDelivery: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString() : new Date().toISOString(),
        thumbnail: o.exceptionEvidenceUrl || 'https://images.unsplash.com/photo-1583391733958-d25e07fac04f?auto=format&fit=crop&w=400&q=80', // Fallback to generic boutique image
        dispatchDate: o.dispatchDate ? new Date(o.dispatchDate).toISOString() : null,
        courierName: o.courierName,
        trackingId: o.trackingId,
        trackingUrl: o.trackingUrl,
      }))
    };
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function updateOrderDetailsAction(orderId: string, data: any) {
  const orderService = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';
  try {
    const updated = await orderService.updateOrderDetails(tenantId, orderId, data);
    return { success: true, order: updated };
  } catch (error: any) {
    console.error('Failed to update order:', error);
    return { success: false, error: error.message || String(error) };
  }
}
