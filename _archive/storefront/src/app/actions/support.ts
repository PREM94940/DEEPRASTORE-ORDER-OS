'use server';

import { OrderService } from '@deeprastore/infrastructure/src/services/OrderService';

export async function submitSupportTicketAction(orderId: string, issueType: string, description: string, evidenceUrl: string) {
  const orderService = new OrderService();
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    const order = await orderService.createSupportTicket(tenantId, orderId, issueType, description, evidenceUrl);
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error('Failed to submit support ticket:', error);
    return { success: false, error: error.message };
  }
}
