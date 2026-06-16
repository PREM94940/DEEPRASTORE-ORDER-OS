'use server';

import { db } from '@deeprastore/infrastructure';
import { systemAlerts } from '@deeprastore/infrastructure/src/schema/system';
import { desc } from 'drizzle-orm';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

export async function logSystemAlert(level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL', source: string, message: string, metadata?: any) {
  try {
    console.log(`[logSystemAlert] Attempting to insert alert: ${level} - ${source} - ${message}`);
    const result = await db.insert(systemAlerts).values({
      alertType: source,
      severity: level,
      message,
      metadata: metadata || null,
    }).returning();
    console.log(`[logSystemAlert] Insert successful:`, result);
    return true;
  } catch (error) {
    console.error('[logSystemAlert] Failed to log system alert:', error);
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
