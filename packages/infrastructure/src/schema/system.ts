import { pgTable, varchar, timestamp, jsonb, text, uuid } from 'drizzle-orm/pg-core';

export const systemAlerts = pgTable('system_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  alertType: varchar('alert_type', { length: 255 }).notNull(),
  severity: varchar('severity', { length: 50 }).notNull(),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});
