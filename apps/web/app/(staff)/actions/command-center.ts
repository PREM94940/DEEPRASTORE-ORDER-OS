'use server';

import { OrderRepository } from '@deeprastore/infrastructure/src/repositories/OrderRepository';
import { revalidatePath } from 'next/cache';
import { notifyOrderReady, notifyOrderDispatched, notifyOrderCreated, notifyPaymentReceived } from './notifications';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

const orderRepo = new OrderRepository();

export async function moveOrderAction(
  orderId: string,
  newStatus: string,
  reason: string = 'Drag and Drop',
  staffId: string = 'MasterJi01'
) {
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    await orderRepo.updateOrderProductionStatusWithAudit(
      null, 
      tenantId, 
      orderId, 
      newStatus, 
      reason, 
      staffId
    );
    
    if (newStatus === 'READY_TO_SHIP') {
      notifyOrderReady('CUSTOMER_PHONE', orderId).catch(console.error);
    }
    
    revalidatePath('/');
    revalidatePath('/production');
    revalidatePath('/dispatch');
    revalidatePath('/payments');
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
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    await orderRepo.updateOrderDispatchStatusWithAudit(
      null,
      tenantId,
      orderId,
      newStatus,
      staffId
    );
    
    revalidatePath('/');
    revalidatePath('/production');
    revalidatePath('/dispatch');
    revalidatePath('/payments');
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
  const tenantId = '11111111-1111-1111-1111-111111111111';

  try {
    await orderRepo.updateOrderDispatchStatusWithAudit(
      null,
      tenantId,
      orderId,
      'DISPATCHED',
      staffId,
      { courierName, trackingId, dispatchDate: new Date() }
    );
    notifyOrderDispatched('CUSTOMER_PHONE', orderId, courierName, trackingId).catch(console.error);
    
    revalidatePath('/');
    revalidatePath('/production');
    revalidatePath('/dispatch');
    revalidatePath('/payments');
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
  const tenantId = '11111111-1111-1111-1111-111111111111';

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
    notifyOrderCreated(data.customerPhone, order.id, data.totalAmount, data.advanceAmount).catch(console.error);
    
    revalidatePath('/');
    revalidatePath('/production');
    revalidatePath('/dispatch');
    revalidatePath('/payments');
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
  const tenantId = '11111111-1111-1111-1111-111111111111';
  try {
    await db.transaction(async (tx) => {
      await orderRepo.addPayment(tx, tenantId, orderId, amount, staffId, utr);
      await orderRepo.updatePaymentUTR(tx, tenantId, orderId, utr);
    });
    notifyPaymentReceived('CUSTOMER_PHONE', orderId, amount).catch(console.error);
    
    revalidatePath('/');
    revalidatePath('/production');
    revalidatePath('/dispatch');
    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
