import { pgTable, varchar, timestamp, uuid, integer, text } from 'drizzle-orm/pg-core';

export const otpVerifications = pgTable('otp_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 50 }).notNull(),
  code: varchar('code', { length: 10 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  attemptsCount: integer('attempts_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customerAuditLogs = pgTable('customer_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 50 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // REQUESTED, VERIFIED, FAILED, LOCKED, LOGIN, LOGOUT
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
