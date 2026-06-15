import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';


export const bugRegistry = pgTable('bug_registry', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: varchar('business_id', { length: 50 }).notNull().unique(), // e.g. BUG-2026-0001
  date: timestamp('date').defaultNow().notNull(),
  reportedBy: varchar('reported_by', { length: 255 }).notNull(), // name or email or system ID
  source: varchar('source', { length: 50 }).notNull(), // 'STAFF', 'CUSTOMER', 'PLAYWRIGHT', 'AUDIT', 'SYSTEM'
  severity: varchar('severity', { length: 10 }).notNull(), // 'P0', 'P1', 'P2', 'P3'
  module: varchar('module', { length: 100 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).default('OPEN').notNull(), // 'OPEN', 'IN_PROGRESS', 'RESOLVED'
  fixedDate: timestamp('fixed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
