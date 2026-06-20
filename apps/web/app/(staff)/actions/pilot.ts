// @ts-nocheck
'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

// Safe query wrapper — if a query fails or hangs, return a default value instead of crashing the entire dashboard
async function safeQuery(label: string, fn: () => Promise<any>, fallback: any): Promise<any> {
  try {
    // Race against a 4-second timeout to prevent Vercel function hangs
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), 4000))
    ]);
    return result;
  } catch (error: any) {
    console.error(`[Dashboard] ${label} failed:`, error.message);
    return fallback;
  }
}

export async function getPilotMetrics() {
  const startTime = Date.now();

  // Core orders query — this is the only critical query
  const ordersResult = await safeQuery('orders-stats', () => db.execute(sql`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN created_at >= CURRENT_DATE AND status != 'CANCELLED' THEN 1 ELSE 0 END) as todays_orders,
      SUM(CASE WHEN created_at >= CURRENT_DATE AND status != 'CANCELLED' THEN total_amount ELSE 0 END) as todays_revenue,
      SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_orders,
      SUM(CASE WHEN status != 'CANCELLED' THEN 1 ELSE 0 END) as active_total_orders,
      SUM(CASE WHEN payment_status = 'PENDING' OR payment_status = 'REJECTED' THEN 1 ELSE 0 END) as pending_payments,
      SUM(CASE WHEN status IN ('CUTTING', 'STITCHING', 'QC') AND expected_delivery_date < CURRENT_DATE THEN 1 ELSE 0 END) as production_delays,
      SUM(CASE WHEN status = 'READY_TO_SHIP' THEN 1 ELSE 0 END) as ready_to_dispatch,
      SUM(CASE WHEN status NOT IN ('DELIVERED', 'DISPATCHED', 'CANCELLED') AND expected_delivery_date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue_orders,
      SUM(CASE WHEN status = 'DRAFT' AND created_at < NOW() - INTERVAL '30 minutes' THEN 1 ELSE 0 END) as stuck_draft,
      SUM(CASE WHEN payment_status = 'PENDING_VERIFICATION' AND created_at < NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) as stuck_payment,
      SUM(CASE WHEN status = 'READY_TO_SHIP' AND updated_at < NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as stuck_dispatch
    FROM orders
    WHERE is_deleted = false
  `), [{}]);

  // Actionable lists — run in parallel, each with its own timeout
  const [pendingPaymentsList, stuckDraftsList, readyDispatchList, founderCount] = await Promise.all([
    safeQuery('pending-payments', () => db.execute(sql`
      SELECT p.id, p.amount, o.business_id 
      FROM payments p 
      JOIN orders o ON p.order_id = o.id 
      WHERE p.status = 'UNVERIFIED' OR p.status = 'PENDING'
      ORDER BY p.created_at DESC LIMIT 3
    `), []),
    safeQuery('stuck-drafts', () => db.execute(sql`
      SELECT id, business_id, customer_name, total_amount 
      FROM orders 
      WHERE status = 'DRAFT' AND created_at < NOW() - INTERVAL '30 minutes'
      ORDER BY created_at ASC LIMIT 3
    `), []),
    safeQuery('ready-dispatch', () => db.execute(sql`
      SELECT id, business_id, customer_name 
      FROM orders 
      WHERE status = 'READY_TO_SHIP'
      ORDER BY updated_at ASC LIMIT 3
    `), []),
    safeQuery('founder-interventions', () => db.execute(sql`
      SELECT COUNT(*) as total 
      FROM audit_logs 
      WHERE created_at >= CURRENT_DATE 
      AND staff_id IN (SELECT email FROM approved_staff WHERE role = 'FOUNDER')
    `), [{ total: 0 }])
  ]);

  const executionTime = Date.now() - startTime;
  console.log(`[Pilot Dashboard] Query execution time: ${executionTime}ms`);

  const oStats = ((ordersResult as any).rows || ordersResult)[0] as any;
  const aStats = ((founderCount as any).rows || founderCount)[0] as any;

  return {
    today: {
      todaysOrders: Number(oStats?.todays_orders || 0),
      todaysRevenue: Number(oStats?.todays_revenue || 0),
      totalOrders: Number(oStats?.total || 0),
      activeOrders: Number(oStats?.active_total_orders || 0),
      cancelledOrders: Number(oStats?.cancelled_orders || 0),
      pendingPayments: Number(oStats?.pending_payments || 0),
      productionDelays: Number(oStats?.production_delays || 0),
      readyToDispatch: Number(oStats?.ready_to_dispatch || 0),
      overdueOrders: Number(oStats?.overdue_orders || 0),
      stuckDraft: Number(oStats?.stuck_draft || 0),
      stuckPayment: Number(oStats?.stuck_payment || 0),
      stuckDispatch: Number(oStats?.stuck_dispatch || 0),
      founderInterventions: Number(aStats?.total || 0),
    },
    actionable: {
      payments: ((pendingPaymentsList as any).rows || pendingPaymentsList).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount || 0),
        businessId: p.business_id,
      })),
      drafts: ((stuckDraftsList as any).rows || stuckDraftsList).map((d: any) => ({
        id: d.id,
        businessId: d.business_id,
        customerName: d.customer_name,
        totalAmount: Number(d.total_amount || 0),
      })),
      dispatch: ((readyDispatchList as any).rows || readyDispatchList).map((d: any) => ({
        id: d.id,
        businessId: d.business_id,
        customerName: d.customer_name,
      }))
    },
    risk: {
      exceptions: { critical: 0, high: 0, medium: 0, low: 0 }
    },
    bugs: { p0: 0, p1: 0, p2: 0, p3: 0 },
    health: 'GREEN'
  };
}
