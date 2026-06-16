'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { measurementsHistory } from '@deeprastore/infrastructure/src/schema/customer';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

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
  bust: string;
  waist: string;
  hip: string;
  height: string;
}) {
  try {
    await db.insert(measurementsHistory).values({
      id: uuidv4(),
      customerPhone: normalizePhone(data.customerPhone),
      bust: data.bust,
      waist: data.waist,
      hip: data.hip,
      height: data.height,
      recordedAt: new Date(),
    });

    revalidatePath('/command-center');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCustomerProfileAction(phone: string) {
  try {
    const normalized = normalizePhone(phone);
    if (!normalized) return { success: false, error: 'Invalid phone' };
    
    const [customerRecords, orderRecords, measureRecords] = await Promise.all([
      db.execute(sql`SELECT * FROM customers WHERE phone = ${normalized} OR phone = ${phone} LIMIT 1`),
      db.execute(sql`SELECT id, order_number, order_category, production_status, dispatch_status, status FROM orders WHERE customer_phone = ${normalized} OR customer_phone = ${phone} ORDER BY created_at DESC LIMIT 5`),
      db.execute(sql`SELECT bust, waist, hip, height, recorded_at FROM measurements_history WHERE customer_phone = ${normalized} OR customer_phone = ${phone} ORDER BY recorded_at DESC LIMIT 1`)
    ]);

    const customer = (customerRecords.rows?.[0] as any) || null;
    const orders = (orderRecords.rows || []) as any[];
    const measurement = (measureRecords.rows?.[0] as any) || null;

    return {
      success: true,
      payload: {
        metrics: { 
          ltv: Number(customer?.ltv || 0), 
          totalOrders: Number(customer?.total_orders || orders.length) 
        },
        recentOrders: orders.map(o => ({
          id: o.id,
          orderNumber: o.order_number || o.id.slice(0, 8),
          category: o.order_category,
          productionStatus: o.production_status,
          dispatchStatus: o.dispatch_status,
          status: o.status
        })),
        measurements: measurement ? {
          bust: measurement.bust,
          waist: measurement.waist,
          hip: measurement.hip,
          height: measurement.height,
          updatedAt: new Date(measurement.recorded_at).toLocaleDateString()
        } : undefined,
        leads: []
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
