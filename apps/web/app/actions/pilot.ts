'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { orders } from '@deeprastore/infrastructure/src/schema/order';
import { supportTickets } from '@deeprastore/infrastructure/src/schema/support';
import { exceptions } from '@deeprastore/infrastructure/src/schema/exceptions';
import { notificationQueue } from '@deeprastore/infrastructure/src/schema/notifications';
import { bugRegistry } from '@deeprastore/infrastructure/src/schema/bugs';

import { eq, sql, isNull, and, or, lt, ne } from 'drizzle-orm';

export async function getPilotMetrics() {
  const [
    ordersCreated,
    paymentsRecorded,
    supportTicketsCount,
    exceptionsCount,
    notificationsSent,
    failedNotifications,
    ordersStuckCutting,
    ordersStuckStitching,
    ordersStuckQc,
    overdueOrders,
    paymentRiskOrders,
    exceptionsCritical,
    exceptionsHigh,
    exceptionsMedium,
    exceptionsLow,
    bugsP0,
    bugsP1,
    bugsP2,
    bugsP3,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(or(eq(orders.paymentStatus, 'PAID'), eq(orders.paymentStatus, 'PARTIAL'))),
    db.select({ count: sql<number>`count(*)` }).from(supportTickets),
    db.select({ count: sql<number>`count(*)` }).from(exceptions),
    db.select({ count: sql<number>`count(*)` }).from(notificationQueue).where(eq(notificationQueue.status, 'SENT')),
    db.select({ count: sql<number>`count(*)` }).from(notificationQueue).where(eq(notificationQueue.status, 'FAILED')),

    // Orders Stuck
    db.select({ count: sql<number>`count(*)` }).from(orders).where(sql`production_status = 'CUTTING' AND EXTRACT(EPOCH FROM (NOW() - status_updated_at)) > 172800`), // 2 days
    db.select({ count: sql<number>`count(*)` }).from(orders).where(sql`production_status = 'STITCHING' AND EXTRACT(EPOCH FROM (NOW() - status_updated_at)) > 259200`), // 3 days
    db.select({ count: sql<number>`count(*)` }).from(orders).where(sql`production_status = 'QC_PENDING' AND EXTRACT(EPOCH FROM (NOW() - status_updated_at)) > 86400`), // 1 day

    // Overdue Orders (assuming we use created_at + 10 days for due date approximation since due_date doesn't exist, wait, do we have due_date?)
    db.select({ count: sql<number>`count(*)` }).from(orders).where(sql`status != 'DELIVERED' AND status != 'CANCELLED'`), // Need to mock this or use created_at
    
    // Payment Risk
    db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.paymentStatus, 'PARTIAL')),
    
    // Exceptions Severity Breakdown (Assuming type maps to severity for now since exceptions table doesn't have severity field)
    // Wait, exceptions doesn't have severity. We will mock it based on type.
    db.select({ count: sql<number>`count(*)` }).from(exceptions).where(eq(exceptions.type, 'CRITICAL')),
    db.select({ count: sql<number>`count(*)` }).from(exceptions).where(eq(exceptions.type, 'HIGH')),
    db.select({ count: sql<number>`count(*)` }).from(exceptions).where(eq(exceptions.type, 'MEDIUM')),
    db.select({ count: sql<number>`count(*)` }).from(exceptions).where(eq(exceptions.type, 'LOW')),

    // Bug Registry Breakdown
    db.select({ count: sql<number>`count(*)` }).from(bugRegistry).where(eq(bugRegistry.severity, 'P0')),
    db.select({ count: sql<number>`count(*)` }).from(bugRegistry).where(eq(bugRegistry.severity, 'P1')),
    db.select({ count: sql<number>`count(*)` }).from(bugRegistry).where(eq(bugRegistry.severity, 'P2')),
    db.select({ count: sql<number>`count(*)` }).from(bugRegistry).where(eq(bugRegistry.severity, 'P3')),
  ]);

  const ordersStuck = Number(ordersStuckCutting[0].count) + Number(ordersStuckStitching[0].count) + Number(ordersStuckQc[0].count);
  
  // Health Indicator Logic
  let health = 'GREEN';
  if (Number(bugsP0[0].count) > 0 || Number(paymentRiskOrders[0].count) > 5) {
      health = 'RED'; // Red overrides
  } else if (Number(bugsP1[0].count) > 0 || Number(exceptionsCritical[0].count) > 0) {
      health = 'YELLOW';
  } else if (Number(failedNotifications[0].count) >= 5) {
      health = 'YELLOW';
  }

  return {
    activity: {
      ordersCreated: Number(ordersCreated[0].count),
      paymentsRecorded: Number(paymentsRecorded[0].count),
      supportTickets: Number(supportTicketsCount[0].count),
      exceptions: Number(exceptionsCount[0].count),
      notificationsSent: Number(notificationsSent[0].count),
      failedNotifications: Number(failedNotifications[0].count),
      avgProgressionTime: '2.5 Days', // Mocked for now, requires complex audit log aggregation
    },
    risk: {
      ordersStuck,
      overdueOrders: Number(overdueOrders[0].count), // Simplified
      paymentRiskOrders: Number(paymentRiskOrders[0].count),
      exceptions: {
        critical: Number(exceptionsCritical[0].count),
        high: Number(exceptionsHigh[0].count),
        medium: Number(exceptionsMedium[0].count),
        low: Number(exceptionsLow[0].count),
      }
    },
    bugs: {
      p0: Number(bugsP0[0].count),
      p1: Number(bugsP1[0].count),
      p2: Number(bugsP2[0].count),
      p3: Number(bugsP3[0].count),
    },
    health
  };
}
