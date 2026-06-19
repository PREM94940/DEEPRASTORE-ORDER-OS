# DEEPRASTORE: CURRENT PROJECT STATE
**Date**: June 19, 2026
**Current Phase**: Wave 1 (Pilot Reality Validation)
**Development Status**: 🔴 **HARD FEATURE FREEZE**

---

## 1. ARCHITECTURE & REPOSITORIES

Following the aggressive scope reduction to prevent architectural drift, the system has been officially split.

### The Active Core: `D:\DEEPRASTORE ORDER OS`
This is the only repository actively being tested. It contains strictly the Operational MVP.
*   **Admin Portal**: `apps/admin-portal`
    *   *Role*: Staff Dashboard, Quick Link Generation, Operations Tracking, Master Ji Queue, Payment Verification.
*   **Storefront Portal**: `apps/storefront`
    *   *Role*: Customer-facing live tracking and Support/Replacement Hub.
*   **Infrastructure**: `packages/infrastructure`
    *   *Role*: Pure order, customer, and payment persistence. Decoupled entirely from product catalogs.

### The Archived Core: `D:\DEEPRASTORE OS V2`
*   Contains the deprecated/archived Theme Builder, Storefront Editor, and CMS logic. 
*   **Status**: Abandoned until operational basics are proven.

---

## 2. THE OPERATIONAL RULES (WAVE 1)

These rules are currently hard-coded into the Order OS and must be adhered to during the pilot:

> [!IMPORTANT]
> **The Golden Rule**
> No System Order Number = No Production. WhatsApp screenshots are strictly prohibited as production triggers.

1.  **Production Gatekeeper**: Master Ji's queue *only* displays orders where `PaymentStatus = VERIFIED` AND `OrderStatus = CONFIRMED`. There are no manual overrides.
2.  **Lead Escalation**: Any WhatsApp lead resting in an `ASSIGNED` or `UNASSIGNED` state for more than 2 hours automatically escalates to a red `NEEDS ATTENTION` status.
3.  **Dynamic Delivery**: Expected delivery dates are calculated dynamically based on specific production stages (Sourcing + Cutting + Stitching + QA + Dispatch) instead of flat assumptions.
4.  **Refund Gating**: Customers cannot request immediate refunds. They must select Replace, Alter, or Store Credit and provide photo evidence. Refunds require Founder approval.

---

## 3. THE 7-DAY LIVE PILOT

We are currently executing the Reality Validation Protocol. 
*   **Data**: No historical imports. Only live, new orders starting today.
*   **Goal**: Validate if real staff and customers will actually adopt the system.

### The Survival Metrics
We are ignoring Revenue and Sales Volume during this phase. Success is measured by:
*   📉 Drop in WhatsApp status queries.
*   📉 Drop in refund requests due to delays.
*   📉 Drop in Founder interruptions.
*   📉 Drop in missed follow-ups (revenue leakage).

---

## 4. NEXT STEPS

1.  Complete the 7-Day Pilot.
2.  Log all human bypasses or confusions in the `Failure Log`.
3.  Review the survival metrics on Day 7.

**If the Pilot Passes**: We consolidate the Order OS and discuss Wave 2 (CRM/Inventory).
**If the Pilot Fails**: We fix the process bottlenecks in Wave 1. No new features will be authorized.
