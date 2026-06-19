# Deeprastore Order OS - System-wide Operational Rules

This directory defines the operational directives for the Deeprastore Order OS. Every AI agent, developer, and script operating on this repository must adhere to these rules.

---

## 1. Project Philosophy & Focus
The sole objective of this system is **preventing order loss, eliminating WhatsApp dependency, and enabling boutique staff to run operations entirely inside a clean system**.
*   **No CRM/ERP Bloat:** Do not build advanced CRM features, marketing engines, campaigns, or loyalty tiers.
*   **No Website Features:** Storefront, lookbook, and public website features are strictly out of scope.
*   **Clean starting counts:** Test data is completely wiped; keep the database clear of mock records.

---

## 2. P0: Order Ingestion & Lifecycle Rules
1.  **Frictionless Ingestion:** Order creation must take under 30 seconds. The only required fields are **Customer Name**, **Phone Number**, **Category**, and **Amount**. All other inputs (measurements, dates, fabric codes) are optional on creation.
2.  **Canonical Status Workflow:** Every order progresses through a single, linear lifecycle status in `orders.status`:
    `DRAFT` -> `PENDING_VERIFICATION` -> `PAYMENT_REJECTED` / `CONFIRMED` -> `CUTTING` -> `STITCHING` -> `FINISHING` -> `QC` -> `READY` -> `PACKING` -> `DISPATCHED` -> `DELIVERED`
3.  **Bypass Prevention (Gatekeeper):** Enforce strict server-side validation. An order **cannot** enter `CUTTING`, `STITCHING`, `FINISHING`, `QC`, or `READY` unless its `paymentStatus` is `VERIFIED`. Block any unauthorized status transitions and output: *"Payment must be verified before production can begin."*
4.  **Payment Rejection:** If a payment is rejected, transition status to `PAYMENT_REJECTED` (do not cancel the order automatically). This preserves the order in the system, allowing the customer to re-upload a screenshot.

---

## 3. P1: Staff Interfaces & Execution Rules
1.  **Tabbed Orders View:** The main orders page (`OperationsGrid`) must group orders into five lifecycle tabs: `Drafts`, `Pending Verification`, `Active Production`, `Ready & Packing`, and `Completed`.
2.  **Isolated Production Screen:** Production staff must only access the active stages (`CUTTING`, `STITCHING`, `QC`, `READY`). Financial and customer details must be hidden on this view.
3.  **Strict Dispatch Requirements:** Moving an order to `Dispatched` requires **Courier Name** and **Tracking ID**. Prevent movement and alert staff if missing.
4.  **Customer360 Drawer:** Keep Customer360 in the slide-out drawer format. Remove all mock risk/loyalty ranks. Display only Name, Phone, City, Measurements, Orders, Payments, and Notes.
5.  **Category Measurements:** Group measurement forms into Lehenga (Waist, Hip, Length), Blouse (Bust, Underbust, Waist, Sleeve, Armhole, Back Neck), and Kurta (Shoulder, Chest, Waist, Hip, Sleeve, Length). These measurements belong to the customer record and must auto-fill future orders.
