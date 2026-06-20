'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { exceptions } from '@deeprastore/infrastructure/src/schema/exceptions';
import { orders } from '@deeprastore/infrastructure/src/schema/order';
import { auditLogs } from '@deeprastore/infrastructure/src/schema/audit';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { requireStaffAuth } from './auth';
import { OrderRepository } from '@deeprastore/infrastructure/src/repositories/OrderRepository';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

export async function raiseException({ orderId, type, severity, description, photoUrl }: { orderId: string, type: string, severity: string, description: string, photoUrl?: string }) {
  try {
    const { staff } = await requireStaffAuth();
    const staffId = staff.email;

    // Spam / Duplicate Check
    const existing = await db.select().from(exceptions).where(and(eq(exceptions.orderId, orderId), eq(exceptions.status, 'OPEN')));
    if (existing.some(e => e.type === type)) {
      throw new Error(`An OPEN exception of type ${type} already exists for this order.`);
    }

    // Fetch WhatsApp Snapshot Data
    const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.tenantId, MOCK_TENANT_ID)));
    if (!order) throw new Error("Order not found");

    const id = randomUUID();
    const businessId = `EXC-2026-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const [exc] = await db.insert(exceptions).values({
      id,
      businessId,
      orderId,
      type,
      severity,
      description,
      photoUrl,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      orderStage: order.status,
      status: 'OPEN',
      raisedByStaffId: staffId,
    }).returning();

    // Transition Order to HOLD via Gatekeeper
    const repo = new OrderRepository();
    await repo.updateOrderProductionStatusWithAudit(
      null, MOCK_TENANT_ID, orderId, 'HOLD', `Exception Raised: ${type}`, staffId
    );

    // Audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      action: 'RAISE_EXCEPTION',
      tableName: 'exceptions',
      recordId: exc.id,
      staffId: staffId,
      newData: { type, severity, description, status: 'OPEN' },
    });

    return { success: true, exception: exc };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignException({ exceptionId }: { exceptionId: string }) {
  try {
    const { staff } = await requireStaffAuth();
    const staffId = staff.email;
    const [exc] = await db.update(exceptions)
      .set({ status: 'IN_PROGRESS' })
      .where(eq(exceptions.id, exceptionId))
      .returning();

    if (!exc) return { success: false, error: "Exception not found" };

    await db.insert(auditLogs).values({
      id: randomUUID(),
      action: 'ASSIGN_EXCEPTION',
      tableName: 'exceptions',
      recordId: exc.id,
      staffId: staffId,
      oldData: { status: 'OPEN' },
      newData: { status: 'IN_PROGRESS' },
    });

    return { success: true, exception: exc };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolveException({ exceptionId, resolution }: { exceptionId: string, resolution: string }) {
  try {
    const { staff } = await requireStaffAuth();
    const staffId = staff.email;
    const role = staff.role;

    // Fetch exception to check type
    const [currentExc] = await db.select().from(exceptions).where(eq(exceptions.id, exceptionId));
    if (!currentExc) return { success: false, error: "Exception not found" };

    if (currentExc.type === 'FOUNDER_APPROVAL' && role !== 'ADMIN') {
      throw new Error("Only an Admin or Founder can resolve a Founder Approval exception.");
    }

    const [exc] = await db.update(exceptions)
      .set({ status: 'RESOLVED', resolvedAt: new Date(), resolvedByStaffId: staffId })
      .where(eq(exceptions.id, exceptionId))
      .returning();

    // Transition Order back to previous stage
    if (exc.orderStage && exc.orderStage !== 'HOLD') {
      const repo = new OrderRepository();
      await repo.updateOrderProductionStatusWithAudit(
        null, MOCK_TENANT_ID, exc.orderId, exc.orderStage, `Exception Resolved: ${exc.type}`, staffId
      );
    }

    await db.insert(auditLogs).values({
      id: randomUUID(),
      action: 'RESOLVE_EXCEPTION',
      tableName: 'exceptions',
      recordId: exc.id,
      staffId: staffId,
      oldData: { status: 'IN_PROGRESS' },
      newData: { status: 'RESOLVED', resolution },
    });

    return { success: true, exception: exc };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
