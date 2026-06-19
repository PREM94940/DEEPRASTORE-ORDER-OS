import { getCustomerSession } from '@/app/(customer)/actions/customer-auth';
import { CustomerAuthForm } from '@/components/customer-auth-form';
import { CustomerDashboard } from '@/components/customer-dashboard';
import { db } from '@deeprastore/infrastructure';
import { orders } from '@deeprastore/infrastructure/src/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const dynamic = "force-dynamic";

export default async function TrackPage() {
  const session = await getCustomerSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111] p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Track Your Order</h1>
            <p className="text-white/50 mt-2">Enter your phone number to see live updates</p>
          </div>
          <CustomerAuthForm />
        </div>
      </div>
    );
  }

  // Fetch orders for this customer
  const customerOrders = await db.select()
    .from(orders)
    .where(
      and(
        eq(orders.customerPhone, session.phone),
        eq(orders.isDeleted, false)
      )
    )
    .orderBy(desc(orders.createdAt));

  // Fetch enquiries for this customer
  const { enquiries } = await import('@deeprastore/infrastructure/src/schema');
  const customerEnquiries = await db.select()
    .from(enquiries)
    .where(eq(enquiries.customerPhone, session.phone))
    .orderBy(desc(enquiries.createdAt));

  if (customerOrders.length === 0 && customerEnquiries.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold">No Orders or Requests Found</h2>
        <p className="text-white/50 mt-2">We couldn't find any active tailoring orders or requests linked to {session.phone}</p>
        <form action={async () => {
          'use server';
          const { logoutCustomer } = await import('@/app/(customer)/actions/customer-auth');
          await logoutCustomer();
        }}>
          <button type="submit" className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            Use Different Number
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <CustomerDashboard orders={customerOrders} enquiries={customerEnquiries} phone={session.phone} />
    </div>
  );
}
