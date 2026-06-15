import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './order';
import { customers } from './customer';

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: varchar('business_id', { length: 50 }).notNull().unique(), // e.g. TICK-2026-0001
  orderId: uuid('order_id').references(() => orders.id),
  customerPhone: varchar('customer_phone', { length: 20 }).references(() => customers.phone),
  
  category: varchar('category', { length: 50 }).notNull(), // e.g. "ALTERATION", "DELAY", "PAYMENT_ISSUE", "GENERAL"
  priority: varchar('priority', { length: 20 }).default('NORMAL').notNull(), // "LOW", "NORMAL", "HIGH", "CRITICAL"
  status: varchar('status', { length: 20 }).default('OPEN').notNull(), // "OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  assignedStaff: varchar('assigned_staff', { length: 100 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});
