'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { exceptions } from '@deeprastore/infrastructure/src/schema/exceptions';
import { auditLogs } from '@deeprastore/infrastructure/src/schema/audit';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function raiseException({ orderId, type, severity, description, staffId }: { orderId: string, type: string, severity: string, description: string, staffId: string }) {
  try {
    const id = randomUUID();
    const businessId = `EXC-2026-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const [exc] = await db.insert(exceptions).values({
      id,
      businessId,
      orderId,
      type,
      severity,
      description,
      status: 'OPEN',
      raisedByStaffId: staffId,
    }).returning();

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

export async function assignException({ exceptionId, staffId }: { exceptionId: string, staffId: string }) {
  try {
    const [exc] = await db.update(exceptions)
      .set({ status: 'IN_PROGRESS' })
      .where(eq(exceptions.id, exceptionId))
      .returning();

    if (!exc) return { success: false, error: "Exception not found" };

    // Audit log
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

export async function resolveException({ exceptionId, staffId, resolution }: { exceptionId: string, staffId: string, resolution: string }) {
  try {
    const [exc] = await db.update(exceptions)
      .set({ status: 'RESOLVED', resolvedAt: new Date() })
      .where(eq(exceptions.id, exceptionId))
      .returning();

    if (!exc) return { success: false, error: "Exception not found" };

    // Audit log
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
