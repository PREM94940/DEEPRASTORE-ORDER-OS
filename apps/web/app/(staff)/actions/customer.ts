'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { customers, customerAddresses, customerNotes, measurementsHistory } from '@deeprastore/infrastructure/src/schema/customer';
import { orders, payments } from '@deeprastore/infrastructure/src/schema/order';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { requireStaffAuth } from './auth';

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.substring(2);
  }
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

export async function updateMeasurementsAction(data: {
  customerPhone: string;
  bust?: string;
  waist?: string;
  hip?: string;
  height?: string;
  customFields?: any;
}) {
  try {
    await requireStaffAuth();
    const normalized = normalizePhone(data.customerPhone);
    const [cust] = await db.select().from(customers).where(eq(customers.phone, normalized));

    await db.insert(measurementsHistory).values({
      id: uuidv4(),
      customerId: cust?.id || null,
      customerPhone: normalized,
      bust: data.bust || null,
      waist: data.waist || null,
      hip: data.hip || null,
      height: data.height || null,
      customFields: data.customFields || null,
      recordedAt: new Date(),
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addCustomerNoteAction(phone: string, note: string) {
  try {
    await requireStaffAuth();
    const normalized = normalizePhone(phone);
    await db.insert(customerNotes).values({
      id: uuidv4(),
      phone: normalized,
      note,
      createdBy: 'Staff01',
      createdAt: new Date(),
    });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCustomerProfileAction(phone: string) {
  try {
    await requireStaffAuth();
    const normalized = normalizePhone(phone);
    if (!normalized) return { success: false, error: 'Invalid phone number' };

    // 1. Get customer
    const [customer] = await db.select().from(customers).where(eq(customers.phone, normalized));
    
    // 2. Get address (city)
    const [address] = await db.select({ city: customerAddresses.city }).from(customerAddresses).where(eq(customerAddresses.customerPhone, normalized)).limit(1);

    // 3. Get orders
    const customerOrders = await db.select().from(orders).where(
      and(
        eq(orders.customerPhone, normalized),
        eq(orders.isDeleted, false)
      )
    ).orderBy(desc(orders.createdAt)).limit(10);

    // 4. Get payments
    let customerPayments: any[] = [];
    if (customerOrders.length > 0) {
      const orderIds = customerOrders.map(o => o.id);
      customerPayments = await db.select().from(payments).where(sql`${payments.orderId} IN ${orderIds}`).orderBy(desc(payments.createdAt));
    }

    // 5. Get notes
    const notes = await db.select().from(customerNotes).where(eq(customerNotes.phone, normalized)).orderBy(desc(customerNotes.createdAt));

    // 6. Get measurements
    const [measurement] = await db.select().from(measurementsHistory).where(eq(measurementsHistory.customerPhone, normalized)).orderBy(desc(measurementsHistory.recordedAt)).limit(1);

    // Calculate LTV dynamically if not set
    const dynamicLtv = Number(customer?.ltv) > 0 
      ? Number(customer?.ltv) 
      : customerOrders
          .filter(o => o.status !== 'CANCELLED' && o.status !== 'DRAFT')
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return {
      success: true,
      payload: {
        id: customer?.id || null,
        name: customer?.name || null,
        phone: normalized,
        city: address?.city || 'Not Set',
        metrics: {
          ltv: dynamicLtv,
          totalOrders: customer?.totalOrders || customerOrders.length
        },
        recentOrders: customerOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber || o.businessId || o.id.slice(0, 8),
          category: o.orderCategory,
          productionStatus: o.productionStatus,
          dispatchStatus: o.dispatchStatus,
          status: o.status,
          totalAmount: Number(o.totalAmount || 0),
          balanceAmount: Number(o.balanceAmount || 0),
          advanceAmount: Number(o.advanceAmount || 0),
          paymentStatus: o.paymentStatus,
          trackingToken: o.trackingToken
        })),
        payments: customerPayments.map(p => ({
          id: p.id,
          orderId: p.orderId,
          amount: Number(p.amount || 0),
          utr: p.utr,
          status: p.status,
          createdAt: p.createdAt.toISOString()
        })),
        notes: notes.map(n => ({
          id: n.id,
          note: n.note,
          createdAt: n.createdAt.toISOString()
        })),
        measurements: measurement ? {
          bust: measurement.bust,
          waist: measurement.waist,
          hip: measurement.hip,
          height: measurement.height,
          customFields: measurement.customFields || {},
          updatedAt: new Date(measurement.recordedAt).toLocaleDateString()
        } : undefined
      }
    };
  } catch (error: any) {
    console.error('Error in getCustomerProfileAction:', error);
    return { success: false, error: error.message };
  }
}

export async function globalSearchAction(query: string) {
  try {
    await requireStaffAuth();
    if (!query) return { success: false, error: 'Empty query' };
    
    const normalizedPhone = normalizePhone(query);
    if (normalizedPhone.length === 10) {
      const [c] = await db.select().from(customers).where(eq(customers.phone, normalizedPhone));
      if (c) return { success: true, phone: normalizedPhone };
      // Fallback: order with that phone even if no customer record yet
      const [o] = await db.select().from(orders).where(eq(orders.customerPhone, normalizedPhone)).limit(1);
      if (o) return { success: true, phone: normalizedPhone };
    }
    
    const qLower = query.toLowerCase();
    
    // Search Orders (Order ID, Shopify Number, Name)
    const [ord] = await db.select().from(orders).where(
      sql`LOWER(${orders.businessId}) LIKE ${'%' + qLower + '%'} OR LOWER(${orders.customerName}) LIKE ${'%' + qLower + '%'}`
    ).limit(1);
    if (ord && ord.customerPhone) return { success: true, phone: ord.customerPhone };
    
    // Search Payments (UTR)
    const [pay] = await db.select().from(payments).where(
      sql`LOWER(${payments.utr}) LIKE ${'%' + qLower + '%'}`
    ).limit(1);
    
    if (pay) {
      const [payOrd] = await db.select().from(orders).where(eq(orders.id, pay.orderId));
      if (payOrd && payOrd.customerPhone) return { success: true, phone: payOrd.customerPhone };
    }
    
    // Search Customers (Name)
    const [cust] = await db.select().from(customers).where(
      sql`LOWER(${customers.name}) LIKE ${'%' + qLower + '%'}`
    ).limit(1);
    if (cust && cust.phone) return { success: true, phone: cust.phone };

    return { success: false, error: 'Not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
