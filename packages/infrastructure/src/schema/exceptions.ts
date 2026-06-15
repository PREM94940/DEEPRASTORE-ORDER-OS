import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { orders } from './order';
import { approvedStaff } from './staff';

export const exceptions = pgTable('exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: varchar('business_id', { length: 50 }).notNull().unique(), // e.g. EXC-2026-0001
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  
  type: varchar('type', { length: 50 }).notNull(), // "MISSING_MEASUREMENT", "PAYMENT_FAILED", "MATERIAL_SHORTAGE", "QUALITY_FAIL"
  severity: varchar('severity', { length: 20 }).default('MEDIUM').notNull(), // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  status: varchar('status', { length: 20 }).default('OPEN').notNull(), // "OPEN", "IN_PROGRESS", "RESOLVED"
  
  description: text('description').notNull(),
  
  raisedByStaffId: varchar('raised_by_staff_id', { length: 255 }).references(() => approvedStaff.email),
  resolvedByStaffId: varchar('resolved_by_staff_id', { length: 255 }).references(() => approvedStaff.email),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});
