export const dynamic = "force-dynamic";
import { db } from "@deeprastore/infrastructure/src/db/client";
import { payments } from "@deeprastore/infrastructure/src/schema/order";
import { orders } from "@deeprastore/infrastructure/src/schema/order";
import { eq, desc } from "drizzle-orm";
import { PaymentQueue } from "@/components/payment-queue";

export default async function PaymentCenterPage() {
  // Fetch unverified payments joined with order details
  const queueData = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      utr: payments.utr,
      screenshotUrl: payments.screenshotUrl,
      status: payments.status,
      createdAt: payments.createdAt,
      orderId: orders.id,
      businessId: orders.businessId,
      customerPhone: orders.customerPhone,
      customerName: orders.customerName,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(eq(orders.isDeleted, false))
    .orderBy(desc(payments.createdAt));

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Center</h1>
          <p className="text-sm text-zinc-400">Verify incoming payment screenshots against UTRs.</p>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <PaymentQueue initialData={queueData} />
      </div>
    </div>
  );
}
