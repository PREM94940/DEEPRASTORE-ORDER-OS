'use server';

import { db } from '@deeprastore/infrastructure';
import { orders, enquiries, customers, payments } from '@deeprastore/infrastructure/src/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { notifyOrderCreated, notifyPaymentReceived } from './notifications';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

export async function getPendingEnquiries() {
  try {
    const result = await db.select()
      .from(enquiries)
      .where(and(
        eq(enquiries.tenantId, MOCK_TENANT_ID),
        eq(enquiries.status, 'NEW_ENQUIRY')
      ))
      .orderBy(desc(enquiries.createdAt));
    return result;
  } catch (error) {
    console.error('Failed to get enquiries:', error);
    return [];
  }
}

export async function convertEnquiryToOrder(enquiryId: string) {
  try {
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, enquiryId));
    if (!enquiry) return { error: 'Enquiry not found' };

    return { success: true, enquiry };
  } catch (error) {
    return { error: 'Failed to convert enquiry' };
  }
}

export async function createUnifiedOrderAction(data: any) {
  try {
    let orderResult;
    let paymentAmount = 0;
    
    await db.transaction(async (tx) => {
      // 1. Find or create customer
      let customerId = data.customerId;
      
      if (!customerId) {
        // Try to find by phone
        const existing = await tx.select().from(customers).where(eq(customers.phone, data.phone));
        if (existing.length > 0) {
          customerId = existing[0].id;
        } else {
          // Create new
          const [newCust] = await tx.insert(customers).values({
            tenantId: MOCK_TENANT_ID,
            name: data.name,
            phone: data.phone,
          }).returning();
          customerId = newCust.id;
        }
      }

      const orderNumber = `DP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const hasPayment = data.advanceAmount && Number(data.advanceAmount) > 0;
      const isCash = data.paymentMethod === 'CASH';
      const initialStatus = hasPayment ? (isCash ? 'CONFIRMED' : 'PENDING_VERIFICATION') : 'DRAFT';
      const initialPaymentStatus = hasPayment ? (isCash ? 'VERIFIED' : 'VERIFICATION_PENDING') : 'UNPAID';

      // 3. Create Order
      const [newOrder] = await tx.insert(orders).values({
        tenantId: MOCK_TENANT_ID,
        customerId: customerId,
        customerPhone: data.phone,
        customerName: data.name,
        source: data.source,
        orderCategory: data.orderType,
        primaryImageUrl: data.attachments?.[0]?.url || '',
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDeliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        measurementStatus: data.measurementStatus,
        fabricSource: data.fabricSource,
        fabricDetails: data.fabricDetails,
        attachments: data.attachments,
        totalAmount: data.totalAmount?.toString() || '0',
        advanceAmount: data.advanceAmount?.toString() || '0',
        balanceAmount: data.balanceAmount?.toString() || '0',
        paymentMethod: data.paymentMethod,
        utrNumber: data.utrNumber || null,
        paymentProofUrl: data.attachments?.[0]?.url || data.paymentProofUrl || null,
        notes: data.notes,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        orderNumber,
      }).returning();
      
      orderResult = newOrder;

      // 4. Update Enquiry Status if this came from an enquiry
      if (data.enquiryId) {
        await tx.update(enquiries)
          .set({ status: 'CONVERTED', orderId: newOrder.id })
          .where(eq(enquiries.id, data.enquiryId));
      }

      // 5. Create Payment Record if advance is paid
      if (hasPayment) {
        paymentAmount = Number(data.advanceAmount);
        await tx.insert(payments).values({
          orderId: newOrder.id,
          amount: data.advanceAmount.toString(),
          utr: data.utrNumber || null,
          screenshotUrl: data.attachments?.[0]?.url || data.paymentProofUrl || null,
          status: isCash ? 'VERIFIED' : 'PENDING',
        });
      }
    });
    
    if (orderResult) {
      await notifyOrderCreated(orderResult.customerPhone, orderResult.id, Number(orderResult.totalAmount), Number(orderResult.advanceAmount));
      if (paymentAmount > 0) {
        await notifyPaymentReceived(orderResult.customerPhone, orderResult.id, paymentAmount);
      }
    }

    revalidatePath('/pilot/order-desk');
    
    return { 
      success: true, 
      order: {
        id: orderResult.id,
        orderNumber: orderResult.orderNumber,
        customerName: orderResult.customerName,
        customerPhone: orderResult.customerPhone,
        totalAmount: orderResult.totalAmount,
        advanceAmount: orderResult.advanceAmount,
        balanceAmount: orderResult.balanceAmount,
        expectedDeliveryDate: orderResult.expectedDeliveryDate,
      }
    };
  } catch (error) {
    console.error('Failed to create order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}
