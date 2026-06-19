# Prioritized Fix List

Do not begin feature development until this list is fully cleared.

## Priority 0: Critical Security & Functional Blockers
1. **Fix Middleware Bypass:** Remove `/pilot/monitoring` and `/pilot/order-desk` from the unauthenticated exclusion list in `apps/web/middleware.ts`. Add `/intake` to the exclusion list.
2. **Server Action Authentication:** Implement a global server action wrapper (e.g., `authAction`) or inject role checks inside every action in `apps/web/app/(staff)/actions` (especially `fetchAllOrdersAction` and `approvePaymentAction`).
3. **Database Migration Sync:** Generate and execute Drizzle migrations for `packages/infrastructure/src/schema/enquiry.ts` and `order.ts`. Ensure `enquiry_quotes`, `enquiry_comments`, and `orders.is_deleted` are successfully created in the production database.

## Priority 1: High Risk Vulnerabilities
4. **API Endpoint Protection:** Secure `/api/upload/presigned-url` by requiring a valid Supabase Auth session token before returning a signed upload URL.
5. **Webhook Integrity:** Add cryptographic signature verification to `/api/whatsapp` to ensure requests actually originated from the webhook provider.

## Priority 2: Data Isolation & Operations
6. **Customer Query Isolation:** Refactor `fetchCustomerOrdersAction` to verify that the requested phone number matches the decoded magic token/OTP session. Do not rely on client-supplied phone strings.
7. **Role Fine-Tuning:** Restrict access to `/settings` and other administrative panels for the `OPERATIONS` role in `middleware.ts`.
