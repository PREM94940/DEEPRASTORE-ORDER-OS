import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { customers } from './customer';

export const notificationQueue = pgTable('notification_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  channel: varchar('channel', { length: 20 }).notNull(), // 'WHATSAPP', 'SMS', 'EMAIL'
  recipient: varchar('recipient', { length: 255 }).notNull(), // phone number or email
  customerPhone: varchar('customer_phone', { length: 20 }).references(() => customers.phone),
  
  messageTemplateId: varchar('message_template_id', { length: 100 }), // e.g. "ORDER_DISPATCHED"
  messageBody: text('message_body').notNull(),
  
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // 'PENDING', 'SENT', 'FAILED'
  errorDetails: text('error_details'),
  
  scheduledFor: timestamp('scheduled_for').defaultNow().notNull(),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
