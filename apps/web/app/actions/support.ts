'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { supportTickets } from '@deeprastore/infrastructure/src/schema/support';
import { auditLogs } from '@deeprastore/infrastructure/src/schema/audit';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function createTicket({ customerPhone, orderId, category, priority, title, description, staffId }: { customerPhone: string, orderId?: string, category: string, priority: string, title: string, description: string, staffId: string }) {
  try {
    const { randomUUID } = require('crypto');
    const id = randomUUID();
    const businessId = `TICK-2026-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const [ticket] = await db.insert(supportTickets).values({
      id,
      businessId,
      customerPhone,
      orderId,
      category,
      priority,
      title,
      description,
      status: 'OPEN',
    }).returning();

    await db.insert(auditLogs).values({
      id: randomUUID(),
      action: 'CREATE_TICKET',
      tableName: 'support_tickets',
      recordId: ticket.id,
      staffId: staffId,
      newData: { title, description, status: 'OPEN' },
    });

    return { success: true, ticket };
  } catch (error: any) {
    console.error("ACTION ERROR:", error);
    return { success: false, error: error.message };
  }
}

export async function assignTicket({ ticketId, staffId, assignedTo }: { ticketId: string, staffId: string, assignedTo: string }) {
  try {
    const [ticket] = await db.update(supportTickets)
      .set({ status: 'IN_PROGRESS', assignedStaff: assignedTo, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!ticket) return { success: false, error: "Ticket not found" };

    await db.insert(auditLogs).values({
      id: randomUUID(),
      action: 'ASSIGN_TICKET',
      tableName: 'support_tickets',
      recordId: ticket.id,
      staffId: staffId,
      oldData: { status: 'OPEN' },
      newData: { status: 'IN_PROGRESS', assignedStaff: assignedTo },
    });

    return { success: true, ticket };
  } catch (error: any) {
    console.error("ACTION ERROR:", error);
    return { success: false, error: error.message };
  }
}

export async function escalateTicket({ ticketId, staffId }: { ticketId: string, staffId: string }) {
  try {
    const [ticket] = await db.update(supportTickets)
      .set({ priority: 'CRITICAL', updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!ticket) return { success: false, error: "Ticket not found" };

    await db.insert(auditLogs).values({
      id: randomUUID(),
      action: 'ESCALATE_TICKET',
      tableName: 'support_tickets',
      recordId: ticket.id,
      staffId: staffId,
      newData: { priority: 'CRITICAL' },
    });

    return { success: true, ticket };
  } catch (error: any) {
    console.error("ACTION ERROR:", error);
    return { success: false, error: error.message };
  }
}

export async function resolveTicket({ ticketId, staffId, resolution }: { ticketId: string, staffId: string, resolution: string }) {
  try {
    const [ticket] = await db.update(supportTickets)
      .set({ status: 'RESOLVED', resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!ticket) return { success: false, error: "Ticket not found" };

    await db.insert(auditLogs).values({
      id: randomUUID(),
      action: 'RESOLVE_TICKET',
      tableName: 'support_tickets',
      recordId: ticket.id,
      staffId: staffId,
      oldData: { status: 'IN_PROGRESS' },
      newData: { status: 'RESOLVED', resolution },
    });

    return { success: true, ticket };
  } catch (error: any) {
    console.error("ACTION ERROR:", error);
    return { success: false, error: error.message };
  }
}
