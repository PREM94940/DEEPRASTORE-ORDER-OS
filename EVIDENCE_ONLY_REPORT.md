# Deeprastore Order OS - P0 Evidence Only Report

This document contains factual evidence regarding the claims raised by the audit agents. No fixes or refactors have been applied.

---

### A. Backend Dispatch Gatekeeper Bypass
**Claim Assessment: TRUE (Vulnerability Exists)**

*   **File Path:** `packages/infrastructure/src/repositories/OrderRepository.ts`
*   **Line Numbers:** 209-220
*   **Exact Code Snippet:**
    ```typescript
    // Keep old production/dispatch columns in sync if they are production/dispatch stages
    if (['CUTTING', 'STITCHING', 'QC', 'READY_TO_SHIP', 'HOLD'].includes(newStatus)) {
      updateFields.productionStatus = newStatus === 'QC' ? 'QC_PENDING' : newStatus;
    }
    if (['DISPATCHED', 'DELIVERED'].includes(newStatus)) {
      updateFields.dispatchStatus = newStatus;
    }

    await client.update(orders).set(updateFields).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    ```
*   **Reproduction Steps:**
    1. Retrieve any valid order ID currently in `READY_TO_SHIP`.
    2. Invoke the generic `moveOrderAction(orderId, 'DISPATCHED')` server action via an API request (simulating a drag-and-drop or direct API bypass).
    3. The action delegates to `updateOrderProductionStatusWithAudit`, which successfully updates the status to `DISPATCHED` while completely skipping the Courier Name, Tracking ID, and zero-balance validations (which are isolated in `dispatchOrderAction`).
*   **Status Location:** Exists in Local, Vercel, and Live Database.

---

### B. CASH Verification Bypass
**Claim Assessment: TRUE (Vulnerability Exists)**

*   **File Path:** `apps/web/app/(staff)/actions/order-desk.ts`
*   **Line Numbers:** 294-297
*   **Exact Code Snippet:**
    ```typescript
    const hasPayment = data.advanceAmount && Number(data.advanceAmount) > 0;
    const isCash = data.paymentMethod === 'CASH';
    const initialStatus = hasPayment ? (isCash ? 'CONFIRMED' : 'PENDING_VERIFICATION') : 'DRAFT';
    const initialPaymentStatus = hasPayment ? (isCash ? 'VERIFIED' : 'VERIFICATION_PENDING') : 'UNPAID';
    ```
*   **Reproduction Steps:**
    1. Create a new unified order via the Order Desk form.
    2. Enter a value `> 0` for Advance Amount.
    3. Select `CASH` as the Payment Method.
    4. Submit the form. The resulting order instantly becomes `CONFIRMED` and `VERIFIED`, bypassing the `PENDING_VERIFICATION` queue intended for all payments.
*   **Status Location:** Exists in Local, Vercel, and Live Database.

---

### C. `isDeleted` Existence in Live Supabase
**Claim Assessment: FALSE (Agent Hallucination)**

The Database Schema subagent claimed that `isDeleted` was never migrated to PostgreSQL, which would cause an application crash when queried. This is **false**.

*   **File Path:** `test-db.ts` (Ad-hoc query script connected to Live DB)
*   **Exact Execution Logs:**
    ```text
    PS D:\DEEPRASTORE ORDER OS\apps\web> npx tsx -r dotenv/config test-db.ts
    SUCCESS: [ { id: '82fdebb7-e5d7-42e9-a245-1af901594f91', isDeleted: true } ]
    ```
*   **Conclusion:** The `isDeleted` column is safely present and populated in the live Supabase database. Queries utilizing `eq(orders.isDeleted, false)` execute successfully without crashing. The subagent deduced failure solely by observing missing migration files rather than testing the live database connection.
*   **Status Location:** Column physically exists and functions normally in Local and Live Database.

---

### D. `ignoreBuildErrors` Value in Production Branch
**Claim Assessment: TRUE (Vulnerability Exists)**

*   **File Path:** `apps/web/next.config.mjs`
*   **Line Numbers:** 10-12
*   **Exact Code Snippet:**
    ```javascript
    typescript: {
      ignoreBuildErrors: true,
    },
    ```
*   **Reproduction Steps:**
    1. Open `apps/web/next.config.mjs`.
    2. Observe the configuration explicitly instructing Vercel to bypass TypeScript compiler validation.
*   **Status Location:** Exists in Local and Deployed Vercel config.
