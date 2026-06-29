'use server';

import { db } from '@deeprastore/infrastructure';
import { enquiries } from '@deeprastore/infrastructure/src/schema';
import { eq, and, gt } from 'drizzle-orm';
import { requireStaffAuth } from './auth';

export async function checkNewIntakesAction(lastCheckedAt: Date | string) {
  try {
    // Only authenticated staff should poll this
    await requireStaffAuth();

    const tenantId = '11111111-1111-1111-1111-111111111111'; // MOCK TENANT
    
    const result = await db.select({
      id: enquiries.id,
      customerName: enquiries.customerName,
      createdAt: enquiries.createdAt,
    })
    .from(enquiries)
    .where(and(
      eq(enquiries.tenantId, tenantId),
      eq(enquiries.status, 'FORM_RECEIVED'),
      gt(enquiries.createdAt, new Date(lastCheckedAt))
    ));

    return result;
  } catch (error) {
    return [];
  }
}
