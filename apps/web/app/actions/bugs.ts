'use server';

import { db } from '@deeprastore/infrastructure/src/db/client';
import { bugRegistry } from '@deeprastore/infrastructure/src/schema/bugs';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

export async function reportBug(data: {
  reportedBy: string;
  source: string;
  severity: string;
  module: string;
  description: string;
}) {
  const businessId = `BUG-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  await db.insert(bugRegistry).values({
    businessId,
    reportedBy: data.reportedBy,
    source: data.source,
    severity: data.severity,
    module: data.module,
    description: data.description,
  });

  return { success: true, businessId };
}

export async function updateBugStatus(businessId: string, status: string) {
  await db
    .update(bugRegistry)
    .set({ status, updatedAt: new Date(), ...(status === 'RESOLVED' ? { fixedDate: new Date() } : {}) })
    .where(eq(bugRegistry.businessId, businessId));
  return { success: true };
}

export async function getBugs() {
  return await db.select().from(bugRegistry).orderBy(desc(bugRegistry.createdAt));
}
