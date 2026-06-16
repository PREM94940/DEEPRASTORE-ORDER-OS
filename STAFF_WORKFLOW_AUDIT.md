# Staff Workflow Audit

This audit evaluates if normal store staff can execute all critical operations through the Live UI, without needing Playwright, SQL, or admin scripts.

## 1. Create Order
**Status**: ✅ **PASS**
**Route**: 
1. Use the **Global Search Bar** at the top of any page.
2. Search for the customer's phone number and press Enter.
3. The **Customer 360 Drawer** opens.
4. Click the blue **+ Order** button under Quick Actions.
5. The `Create New Order` modal opens.
6. Submitting the form creates the order in the `orders` table.

![Create Order Modal](file:///C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/audit_02_create_order.png)

## 2. Record Payment
**Status**: ✅ **PASS**
**Route**: 
1. Use the **Global Search Bar** to open the Customer 360 Drawer.
2. Click the green **Record Payment** button under Quick Actions.
3. The `Record Balance Payment` modal opens.
4. Staff enters Amount and UTR.
5. Submitting changes the order's `paymentStatus` to `VERIFICATION_PENDING`. It will then immediately appear in the **Payment Center Queue**.

![Record Payment Modal](file:///C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/audit_03_record_payment.png)

## 3. Create Support Ticket
**Status**: ✅ **PASS**
**Route**: 
1. Use the **Global Search Bar** to open the Customer 360 Drawer.
2. Click the **Complaint** button under Quick Actions.
3. The `Raise Support Ticket` modal opens.
4. Submitting creates a record and the ticket appears in the **Support Board**.

![Create Ticket Modal](file:///C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/audit_04_create_ticket.png)

## 4. Move Order through Production Stages
**Status**: ✅ **PASS**
**Route**: 
1. Navigate to the **Command Center** (`/command-center`).
2. Drag and drop any order card from its current column to the target column.
3. If dragged to `Hold`, a `Send to Hold` modal pops up to capture the reason.
4. If dragged to `Dispatched`, a `Dispatch Details` modal pops up to capture Courier and Tracking ID.

![Command Center Board](file:///C:/Users/rodda/.gemini/antigravity/brain/63f28882-4b01-4866-8a85-9b242f97ca29/audit_05_command_center.png)

*Note: Order `DP-2026-000048` is missing from Command Center and Payment Queue because its payment status is `UNPAID` and `PACKING`. The Command Center only displays orders with a `VERIFIED` payment, and the Payment Queue only displays `VERIFICATION_PENDING` payments.*

## 5. Create Exception
**Status**: ❌ **FAIL**
**Route**: No UI exists. While the backend Server Actions (`createExceptionAction`) and the UI Board exist, there is no "Raise Exception" button anywhere in the Customer 360 Drawer, Command Center, or Exceptions Board for staff to actually trigger it.

## 6. Create Lead
**Status**: ❌ **FAIL**
**Route**: No UI exists. The Customer 360 Drawer has a "Leads" tab to display leads, but there is no "Add Lead" button to input new leads into the CRM.

---

### Conclusion
The user interface is heavily reliant on the **Global Search** to open the Customer 360 Drawer for 80% of actions (Order, Payment, Support). However, two critical workflows (Exceptions and Leads) are missing their UI entry points.
