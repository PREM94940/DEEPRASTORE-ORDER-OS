'use server';

import { db } from '@deeprastore/infrastructure';
import { systemAlerts } from '@deeprastore/infrastructure/src/schema/system';
import { desc } from 'drizzle-orm';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

export async function logSystemAlert(level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL', source: string, message: string, metadata?: any) {
  try {
    await db.insert(systemAlerts).values({
      tenantId: MOCK_TENANT_ID,
      level,
      source,
      message,
      metadata: metadata || null,
    });
    return true;
  } catch (error) {
    console.error('Failed to log system alert:', error);
    return false;
  }
}

export async function getRecentSystemAlerts() {
  try {
    return await db.select()
      .from(systemAlerts)
      .orderBy(desc(systemAlerts.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Failed to get system alerts:', error);
    return [];
  }
}
