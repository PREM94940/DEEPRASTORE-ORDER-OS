import { pgTable, uuid, varchar, timestamp, numeric } from 'drizzle-orm/pg-core';

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
  customerPhone: varchar('customer_phone', { length: 50 }).notNull(), // Changed from uuid to varchar
  orderId: uuid('order_id'), // Optional, if related to specific order
  staff: varchar('staff', { length: 255 }).notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull(), // DELAY_INFORMED, TRACKING_SHARED, REPLACEMENT_APPROVED, GENERAL
  content: varchar('content', { length: 2048 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerPhone: varchar('customer_phone', { length: 50 }).notNull(),
  orderId: uuid('order_id'),
  type: varchar('type', { length: 50 }),
  status: varchar('status', { length: 50 }).notNull().default('OPEN'),
  description: varchar('description', { length: 2048 }),
  resolution: varchar('resolution', { length: 2048 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const contentPieces = pgTable('content_pieces', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  publishedAt: timestamp('published_at'),
  url: varchar('url', { length: 1024 }),
});

export const contentAttribution = pgTable('content_attribution', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id').notNull().references(() => contentPieces.id),
  orderId: uuid('order_id').notNull(),
  revenue: numeric('revenue', { precision: 10, scale: 2 }).notNull(),
});
