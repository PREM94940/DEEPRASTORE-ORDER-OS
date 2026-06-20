'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { sql } from 'drizzle-orm';

export async function getPilotMetrics() {
  const startTime = Date.now();
  
  // Condense 19 parallel queries into 5 aggregated queries to avoid Vercel 504 timeouts
  const [
    ordersResult,
    exceptionsResult,
    bugsResult,
    notificationsResult,
    ticketsResult,
    auditResult,
    pendingPaymentsList,
    stuckDraftsList,
    readyDispatchList
  ] = await Promise.all([
    db.execute(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN created_at >= CURRENT_DATE THEN 1 ELSE 0 END) as todays_orders,
        SUM(CASE WHEN created_at >= CURRENT_DATE THEN total_amount ELSE 0 END) as todays_revenue,
        SUM(CASE WHEN payment_status = 'PENDING' OR payment_status = 'REJECTED' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN status IN ('CUTTING', 'STITCHING', 'QC') AND expected_delivery_date < CURRENT_DATE THEN 1 ELSE 0 END) as production_delays,
        SUM(CASE WHEN status = 'READY_TO_SHIP' THEN 1 ELSE 0 END) as ready_to_dispatch,
        SUM(CASE WHEN status NOT IN ('DELIVERED', 'DISPATCHED', 'CANCELLED') AND expected_delivery_date < CURRENT_DATE THEN 1 ELSE 0 END) as overdue_orders,
        SUM(CASE WHEN status = 'DRAFT' AND created_at < NOW() - INTERVAL '30 minutes' THEN 1 ELSE 0 END) as stuck_draft,
        SUM(CASE WHEN payment_status = 'PENDING_VERIFICATION' AND created_at < NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) as stuck_payment,
        SUM(CASE WHEN status = 'READY_TO_SHIP' AND updated_at < NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as stuck_dispatch
      FROM orders
      WHERE is_deleted = false
    `),
    db.execute(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END) as low
      FROM exceptions
    `),
    db.execute(sql`
      SELECT 
        SUM(CASE WHEN severity = 'P0' THEN 1 ELSE 0 END) as p0,
        SUM(CASE WHEN severity = 'P1' THEN 1 ELSE 0 END) as p1,
        SUM(CASE WHEN severity = 'P2' THEN 1 ELSE 0 END) as p2,
        SUM(CASE WHEN severity = 'P3' THEN 1 ELSE 0 END) as p3
      FROM bug_registry
    `),
    db.execute(sql`
      SELECT 
        SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
      FROM notification_queue
    `),
    db.execute(sql`SELECT COUNT(*) as total FROM support_tickets`),
    db.execute(sql`
      SELECT COUNT(*) as total 
      FROM audit_logs 
      WHERE created_at >= CURRENT_DATE 
      AND staff_id IN (SELECT email FROM approved_staff WHERE role = 'FOUNDER')
    `),
    db.execute(sql`
      SELECT p.id, p.amount, o.business_id 
      FROM payments p 
      JOIN orders o ON p.order_id = o.id 
      WHERE p.status = 'UNVERIFIED' OR p.status = 'PENDING'
      ORDER BY p.created_at DESC LIMIT 3
    `),
    db.execute(sql`
      SELECT id, business_id, customer_name, total_amount 
      FROM orders 
      WHERE status = 'DRAFT' AND created_at < NOW() - INTERVAL '30 minutes'
      ORDER BY created_at ASC LIMIT 3
    `),
    db.execute(sql`
      SELECT id, business_id, customer_name 
      FROM orders 
      WHERE status = 'READY_TO_SHIP'
      ORDER BY updated_at ASC LIMIT 3
    `)
  ]);

  const executionTime = Date.now() - startTime;
  console.log(`[Pilot Dashboard] Query execution time: ${executionTime}ms`);

  const oStats = ((ordersResult as any).rows || ordersResult)[0] as any;
  const eStats = ((exceptionsResult as any).rows || exceptionsResult)[0] as any;
  const bStats = ((bugsResult as any).rows || bugsResult)[0] as any;
  const nStats = ((notificationsResult as any).rows || notificationsResult)[0] as any;
  const tStats = ((ticketsResult as any).rows || ticketsResult)[0] as any;
  const aStats = ((auditResult as any).rows || auditResult)[0] as any;

  const ordersStuck = Number(oStats?.stuck_cutting || 0) + Number(oStats?.stuck_stitching || 0) + Number(oStats?.stuck_qc || 0);
  
  // Health Indicator Logic
  let health = 'GREEN';
  if (Number(bStats?.p0 || 0) > 0 || Number(oStats?.payment_risk || 0) > 5) {
      health = 'RED'; // Red overrides
  } else if (Number(bStats?.p1 || 0) > 0 || Number(eStats?.critical || 0) > 0) {
      health = 'YELLOW';
  } else if (Number(nStats?.failed || 0) >= 5) {
      health = 'YELLOW';
  }

  return {
    today: {
      todaysOrders: Number(oStats?.todays_orders || 0),
      todaysRevenue: Number(oStats?.todays_revenue || 0),
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
      exceptions: {
        critical: Number(eStats?.critical || 0),
        high: Number(eStats?.high || 0),
        medium: Number(eStats?.medium || 0),
        low: Number(eStats?.low || 0),
      }
    },
    bugs: {
      p0: Number(bStats?.p0 || 0),
      p1: Number(bStats?.p1 || 0),
      p2: Number(bStats?.p2 || 0),
      p3: Number(bStats?.p3 || 0),
    },
    health
  };
}
