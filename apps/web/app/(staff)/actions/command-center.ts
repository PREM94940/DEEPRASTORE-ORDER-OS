'use server';

import { OrderRepository } from '@deeprastore/infrastructure/src/repositories/OrderRepository';
import { revalidatePath } from 'next/cache';
import { notifyOrderReady, notifyOrderDispatched, notifyOrderCreated, notifyPaymentReceived } from './notifications';

const orderRepo = new OrderRepository();

export async function moveOrderAction(
  orderId: string,
  newStatus: string,
  reason: string = 'Drag and Drop',
  staffId: string = 'MasterJi01'
) {
  const tenantId = '33333333-3333-3333-3333-333333333333'; // Hardcoded for V3 Pilot

  try {
    await orderRepo.updateOrderProductionStatusWithAudit(
      null, 
      tenantId, 
      orderId, 
      newStatus, 
      reason, 
      staffId
    );
    
    if (newStatus === 'READY') {
      await notifyOrderReady('CUSTOMER_PHONE', orderId);
    }
    
    revalidatePath('/command-center');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function moveDispatchOrderAction(
  orderId: string,
  newStatus: string,
  staffId: string = 'MasterJi01'
) {
  const tenantId = '33333333-3333-3333-3333-333333333333';

  try {
    await orderRepo.updateOrderDispatchStatusWithAudit(
      null,
      tenantId,
      orderId,
      newStatus,
      staffId
    );
    
    revalidatePath('/command-center');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function dispatchOrderAction(
  orderId: string,
  courierName: string,
  trackingId: string,
  staffId: string = 'MasterJi01'
) {
  const tenantId = '33333333-3333-3333-3333-333333333333';

  try {
    await orderRepo.updateOrderDispatchStatusWithAudit(
      null,
      tenantId,
      orderId,
      'DISPATCHED',
      staffId,
      { courierName, trackingId, dispatchDate: new Date() }
    );

    await notifyOrderDispatched('CUSTOMER_PHONE', orderId, courierName, trackingId);
    
    revalidatePath('/command-center');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createOrderAction(data: {
  customerPhone: string;
  customerName?: string;
  category: string;
  totalAmount: number;
  advanceAmount: number;
  expectedDeliveryDate: string;
  primaryImageUrl: string;
}, staffId: string = 'MasterJi01') {
  const tenantId = '33333333-3333-3333-3333-333333333333';

  try {
    const order = await orderRepo.createOrder(null, {
      tenantId,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      orderCategory: data.category,
      totalAmount: data.totalAmount.toString(),
      expectedDeliveryDate: new Date(data.expectedDeliveryDate),
      primaryImageUrl: data.primaryImageUrl,
    } as any);

    if (data.advanceAmount > 0) {
      await orderRepo.addPayment(null, tenantId, order.id, data.advanceAmount, staffId, 'ADVANCE_PAYMENT');
    }
    
    await notifyOrderCreated(data.customerPhone, order.id, data.totalAmount, data.advanceAmount);
    
    revalidatePath('/command-center');
    return { success: true, orderId: order.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addPaymentAction(
  orderId: string,
  amount: number,
  utr: string,
  staffId: string = 'MasterJi01'
) {
  const tenantId = '33333333-3333-3333-3333-333333333333';
  try {
    await orderRepo.addPayment(null, tenantId, orderId, amount, staffId, utr);
    
    await notifyPaymentReceived('CUSTOMER_PHONE', orderId, amount);

    revalidatePath('/command-center');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
