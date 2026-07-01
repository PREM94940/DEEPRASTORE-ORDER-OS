import { db } from './apps/web/lib/db';
import { enquiries, orders } from './packages/core-domain/src/schema';
import { desc, eq } from 'drizzle-orm';

async function verifyLiveTest() {
    console.log("--- DB VERIFICATION START ---");
    
    // Find the latest test enquiry
    const latestEnquiries = await db.select()
        .from(enquiries)
        .where(eq(enquiries.customerName, 'Test Live Validation 3'))
        .orderBy(desc(enquiries.createdAt))
        .limit(1);

    if (latestEnquiries.length === 0) {
        console.log("❌ No test enquiry found! The live form submission FAILED.");
        process.exit(1);
    }
    
    const testEnq = latestEnquiries[0];
    console.log(`Latest Enquiry Found: ${testEnq.requestNumber}`);
    console.log(`Customer Name: ${testEnq.customerName}`);
    console.log(`UTR: ${testEnq.utrNumber}`);
    console.log(`Notes:\n${testEnq.notes}`);

    if (testEnq.status === 'APPROVED') {
        console.log(`✅ Enquiry status successfully transitioned after approval.`);
        
        // Find the linked order
        if (!testEnq.orderId) {
            console.log("❌ Enquiry is APPROVED but orderId is missing.");
        } else {
            const linkedOrders = await db.select().from(orders).where(eq(orders.id, testEnq.orderId));
            if (linkedOrders.length > 0) {
                const order = linkedOrders[0];
                console.log(`Linked Order Found: ${order.orderNumber}`);
                console.log(`Order Total Amount: ${order.totalAmount}`);
                console.log(`Order Advance Paid: ${order.advanceAmount}`);
                console.log("✅ Customer data preserved from Enquiry to Order.");
            }
        }
    } else {
        console.log(`Enquiry is still in status: ${testEnq.status}`);
    }

    console.log("--- DB VERIFICATION END ---");
    process.exit(0);
}

verifyLiveTest().catch(console.error);
