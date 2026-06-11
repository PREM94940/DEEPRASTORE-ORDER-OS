// Drizzle schema stub
export const outbox_events = {
  id: 'uuid',
  eventName: 'varchar',
  payload: 'jsonb',
  processedAt: 'timestamp',
};

// Mock function to represent the Transactional Outbox write
export async function insertOutboxEvent(dbTransaction: any, event: any) {
  // In reality: await tx.insert(outbox_events).values(...)
  return true;
}
