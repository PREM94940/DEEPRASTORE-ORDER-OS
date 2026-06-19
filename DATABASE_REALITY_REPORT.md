# Database Reality Report

This report provides hard evidence for the database drift between the TypeScript definitions and the actual PostgreSQL schema. No code changes or migrations have been executed.

## C. Database Drift Evidence

**Claim:** Advanced features like Quote Versioning and Soft Deletes exist in the TypeScript code but were never migrated to the actual database.

1. **Source of Truth for Postgres:** The Drizzle migrations folder (`d:\DEEPRASTORE ORDER OS\packages\infrastructure\drizzle`) contains the exact SQL statements executed against the production database.
2. **Missing Tables:**
   - **Target:** `enquiry_quotes` and `enquiry_comments`
   - **Evidence:** Searching for the `enquiry_quotes` string across all migration files (`0000_productive_hex.sql` through `0004_flat_korg.sql`) yields **0 results**.
   - **Conclusion:** The tables literally do not exist in the database.

3. **Missing Columns:**
   - **Target:** `is_deleted` (for Soft Delete), `tracking_token`, `current_quote_id`
   - **Evidence:** A search for `is_deleted` across all generated SQL migrations yields **0 results**.
   - **Code vs DB Discrepancy:**
     ```typescript
     // d:\DEEPRASTORE ORDER OS\packages\infrastructure\src\schema\order.ts (Lines 70-71)
     isDeleted: boolean('is_deleted').default(false).notNull(),
     deletedAt: timestamp('deleted_at'),
     ```
     This TypeScript column definition was never compiled into a `ALTER TABLE orders ADD COLUMN is_deleted boolean;` SQL statement.
   - **Conclusion:** Attempting to query `orders.isDeleted` in the Next.js app will result in an immediate `PostgresError: column "is_deleted" does not exist`.

*Note: You can verify this manually by running `npx drizzle-kit status` or `npm run db:generate` in the `packages/infrastructure` folder, which will immediately alert you to the un-pushed schema drift.*
