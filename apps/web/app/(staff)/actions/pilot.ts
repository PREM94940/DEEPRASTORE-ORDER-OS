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
    ticketsResult
  ] = await Promise.all([
    db.execute(sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN payment_status IN ('PAID', 'PARTIAL') THEN 1 ELSE 0 END) as payments_recorded,
        SUM(CASE WHEN payment_status = 'PARTIAL' THEN 1 ELSE 0 END) as payment_risk,
        SUM(CASE WHEN production_status = 'CUTTING' AND EXTRACT(EPOCH FROM (NOW() - status_updated_at)) > 172800 THEN 1 ELSE 0 END) as stuck_cutting,
        SUM(CASE WHEN production_status = 'STITCHING' AND EXTRACT(EPOCH FROM (NOW() - status_updated_at)) > 259200 THEN 1 ELSE 0 END) as stuck_stitching,
        SUM(CASE WHEN production_status = 'QC_PENDING' AND EXTRACT(EPOCH FROM (NOW() - status_updated_at)) > 86400 THEN 1 ELSE 0 END) as stuck_qc,
        SUM(CASE WHEN status NOT IN ('DELIVERED', 'CANCELLED') THEN 1 ELSE 0 END) as overdue_orders
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
    db.execute(sql`SELECT COUNT(*) as total FROM support_tickets`)
  ]);

  const executionTime = Date.now() - startTime;
  console.log(`[Pilot Dashboard] Query execution time: ${executionTime}ms`);

  const oStats = ((ordersResult as any).rows || ordersResult)[0] as any;
  const eStats = ((exceptionsResult as any).rows || exceptionsResult)[0] as any;
  const bStats = ((bugsResult as any).rows || bugsResult)[0] as any;
  const nStats = ((notificationsResult as any).rows || notificationsResult)[0] as any;
  const tStats = ((ticketsResult as any).rows || ticketsResult)[0] as any;

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
    activity: {
      ordersCreated: Number(oStats?.total || 0),
      paymentsRecorded: Number(oStats?.payments_recorded || 0),
      supportTickets: Number(tStats?.total || 0),
      exceptions: Number(eStats?.total || 0),
      notificationsSent: Number(nStats?.sent || 0),
      failedNotifications: Number(nStats?.failed || 0),
      avgProgressionTime: '2.5 Days', // Mocked for now, requires complex audit log aggregation
    },
    risk: {
      ordersStuck,
      overdueOrders: Number(oStats?.overdue_orders || 0), // Simplified
      paymentRiskOrders: Number(oStats?.payment_risk || 0),
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
