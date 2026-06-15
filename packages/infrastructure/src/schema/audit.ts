import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableName: varchar('table_name', { length: 255 }).notNull(),
  recordId: varchar('record_id', { length: 255 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // INSERT, UPDATE, DELETE
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  staffId: varchar('staff_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
