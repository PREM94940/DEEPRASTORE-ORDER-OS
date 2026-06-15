import { pgTable, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

export const approvedStaff = pgTable('approved_staff', {
  email: varchar('email', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
