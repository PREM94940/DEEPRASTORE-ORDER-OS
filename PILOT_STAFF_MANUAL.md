# Deeprastore Order OS - Pilot Staff Manual

> [!IMPORTANT]
> **If you cannot find an order, do NOT assume it is missing.**
> Check:
> 1. Has payment been recorded?
> 2. Has payment been verified?
> 3. Is the order still Draft?
> 4. Search customer phone number first.
> 
> *Most operational actions start from Customer 360.*

Welcome to the 7-Day Controlled Internal Pilot. This system is designed to track every order from payment to dispatch.

## Critical Principle
**All actions start with the customer.** There are no standalone "Create Order" or "New Payment" buttons. You must find the customer first.

---

## The Core Operational Flow

### 1. Find or Create Customer
1. Click the **Search Bar** at the top of the screen (or press `/`).
2. Type the customer's phone number (e.g., `9876543210`) and press **Enter**.
3. The **Customer 360 Drawer** will open on the right. This is your master control panel for that customer.

### 2. Create Order
1. From the Customer 360 Drawer, click the blue **+ Order** button under Quick Actions.
2. Fill in the required details: Category, Total Amount, Advance Amount, Delivery Date, and a Reference Image URL.
3. Click **Create Order**. The order is now in the `DRAFT` or `UNPAID` state.

### 3. Record Payment
1. From the Customer 360 Drawer, click the green **Record Payment** button.
2. Enter the Amount Paid and the UTR (Transaction ID) from the bank/UPI screenshot.
3. Click **Verify Payment**. 
4. The order now moves to the **Payment Center Queue**.

### 4. Verify Payment (Accounts/Admin)
1. Navigate to the **Payment Center** (`/payments`).
2. The payment will appear in the verification queue.
3. Compare the UTR and Amount. If valid, approve it.
4. *Critical:* Only after payment is verified will the order appear in the **Command Center**.

### 5. Move Order Through Production
1. Navigate to the **Command Center** (`/command-center`).
2. The verified order will appear in the appropriate lane (e.g., Measurements, Cutting).
3. Drag and drop the order card to the next lane as work is completed.
4. If an issue arises, drag the order to **Hold** and provide a reason.

### 6. Dispatch
1. When the order reaches the **Packing** stage and is ready to ship, drag it to the **Dispatched** lane.
2. A modal will ask for the **Courier Name** and **Tracking ID**.
3. Enter the details to finalize the order.

---

## Handling Issues During Pilot

During the pilot, two specific workflows are handled manually:

1. **Exceptions**: If a critical error occurs (e.g., wrong fabric cut), open the Customer 360 Drawer and click **Complaint** to raise a Support Ticket. Alternatively, escalate via the staff WhatsApp/Telegram group.
2. **Leads**: New leads will continue to be tracked via the existing manual process (WhatsApp) until the Lead Engine UI is finalized post-pilot.
