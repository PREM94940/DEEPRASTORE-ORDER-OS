import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerName: varchar('customer_name', { length: 255 }),
  phone: varchar('phone', { length: 255 }),
  interestedProduct: varchar('interested_product', { length: 255 }),
  assignedStaff: varchar('assigned_staff', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('NEW_LEAD'), // NEW_LEAD, INTERESTED, WAITING_PAYMENT, ORDER_LINK_SENT, PAYMENT_PENDING, NO_RESPONSE, WON, LOST
  lastContactDate: timestamp('last_contact_date'),
  nextFollowupDate: timestamp('next_followup_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communicationLogs = pgTable('communication_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerId: uuid('customer_id').notNull(), // Links to customer.id or lead.id conceptually
  orderId: uuid('order_id'), // Optional, if related to specific order
  staff: varchar('staff', { length: 255 }).notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull(), // DELAY_INFORMED, TRACKING_SHARED, REPLACEMENT_APPROVED, GENERAL
  content: varchar('content', { length: 2048 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
