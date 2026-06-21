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
    revalidatePath('/orders');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addLineItemToOrderAction(orderId: string, productName: string, quantity: number, price: number) {
  try {
    const { orderLineItems } = await import('@deeprastore/infrastructure/src/schema/order');
    await db.insert(orderLineItems).values({
      tenantId: '11111111-1111-1111-1111-111111111111',
      orderId,
      productId: productName,
      quantity,
      price: price.toString(),
      status: 'PENDING'
    });
    revalidatePath('/orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function spawnNewOrderAction(parentOrderId: string, productName: string, quantity: number, price: number) {
  try {
    const { orders, orderLineItems } = await import('@deeprastore/infrastructure/src/schema/order');
    const { eq } = await import('drizzle-orm');
    
    // Fetch parent order
    const [parentOrder] = await db.select().from(orders).where(eq(orders.id, parentOrderId));
    if (!parentOrder) throw new Error("Parent order not found");
    
    // Create new order
    const orderNumber = `DP-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const [newOrder] = await db.insert(orders).values({
      tenantId: '11111111-1111-1111-1111-111111111111',
      customerId: parentOrder.customerId,
      customerPhone: parentOrder.customerPhone,
      customerName: parentOrder.customerName,
      source: parentOrder.source,
      orderCategory: parentOrder.orderCategory,
      totalAmount: price.toString(),
      balanceAmount: price.toString(),
      advanceAmount: '0',
      status: 'CONFIRMED', // Start as CONFIRMED since payment is verified
      paymentStatus: 'UNPAID', // It will need payment
      orderNumber,
      notes: `Spawned from ${parentOrder.orderNumber}`
    }).returning();
    
    // Add line item
    await db.insert(orderLineItems).values({
      tenantId: '11111111-1111-1111-1111-111111111111',
      orderId: newOrder.id,
      productId: productName,
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
    revalidatePath('/orders');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addLineItemToOrderAction(orderId: string, productName: string, quantity: number, price: number) {
  try {
    const { orderLineItems } = await import('@deeprastore/infrastructure/src/schema/order');
    await db.insert(orderLineItems).values({
      tenantId: '11111111-1111-1111-1111-111111111111',
      orderId,
      productId: productName,
      quantity,
      price: price.toString(),
      status: 'PENDING'
    });
    revalidatePath('/orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function spawnNewOrderAction(parentOrderId: string, productName: string, quantity: number, price: number) {
  try {
    const { orders, orderLineItems } = await import('@deeprastore/infrastructure/src/schema/order');
    const { eq } = await import('drizzle-orm');
    
    // Fetch parent order
    const [parentOrder] = await db.select().from(orders).where(eq(orders.id, parentOrderId));
    if (!parentOrder) throw new Error("Parent order not found");
    
    // Create new order
    const orderNumber = `DP-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const [newOrder] = await db.insert(orders).values({
      tenantId: '11111111-1111-1111-1111-111111111111',
      customerId: parentOrder.customerId,
      customerPhone: parentOrder.customerPhone,
      customerName: parentOrder.customerName,
      source: parentOrder.source,
      orderCategory: parentOrder.orderCategory,
      totalAmount: price.toString(),
      balanceAmount: price.toString(),
      advanceAmount: '0',
      status: 'CONFIRMED', // Start as CONFIRMED since payment is verified
      paymentStatus: 'UNPAID', // It will need payment
      orderNumber,
      notes: `Spawned from ${parentOrder.orderNumber}`
    }).returning();
    
    // Add line item
    await db.insert(orderLineItems).values({
      tenantId: '11111111-1111-1111-1111-111111111111',
      orderId: newOrder.id,
      productId: productName,
      quantity,
      price: price.toString(),
      status: 'PENDING'
    });
    
    revalidatePath('/orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function raiseChangeRequest({
  orderId,
  changeType,
  reason,
  costImpact,
  deliveryImpactDays,
}: {
  orderId: string;
  changeType: string;
  reason: string;
  costImpact: number;
  deliveryImpactDays: number;
}) {
  try {
    const { orderChangeRequests } = await import('@deeprastore/infrastructure/src/schema/order');
    await db.insert(orderChangeRequests).values({
      tenantId: '11111111-1111-1111-1111-111111111111',
      orderId,
      changeType,
      reason,
      costImpact: costImpact.toString(),
      deliveryImpactDays,
      requestedBy: 'MasterJi01', // Mock staff id
      approvalStatus: 'PENDING'
    });
    
    // Set order to HOLD pending change request approval
    const tenantId = '11111111-1111-1111-1111-111111111111';
    await orderRepo.updateOrderProductionStatusWithAudit(
      null, 
      tenantId, 
      orderId, 
      'HOLD', 
      `Change Request Pending: ${changeType}`, 
      'MasterJi01'
    );

    revalidatePath('/orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
