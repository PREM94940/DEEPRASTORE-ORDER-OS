'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { leads } from '@deeprastore/infrastructure/src/schema/crm';
import { auditLogs } from '@deeprastore/infrastructure/src/schema/audit';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateLeadStatus({ leadId, status, staffId }: { leadId: string, status: string, staffId: string }) {
  try {
    const [lead] = await db.update(leads)
      .set({ status })
      .where(eq(leads.id, leadId))
      .returning();

    if (!lead) return { success: false, error: "Lead not found" };

    // Audit log
    const { randomUUID } = require('crypto');
    await db.insert(auditLogs).values({
      id: randomUUID(),
      action: 'UPDATE_LEAD',
      tableName: 'leads',
      recordId: lead.id,
      staffId: staffId,
      oldData: { status: '' },
      newData: { status: status, reason: `Lead moved to ${status}` },
    });

    revalidatePath('/leads');
    return { success: true, lead };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
