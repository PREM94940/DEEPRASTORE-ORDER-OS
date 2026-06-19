import { db } from '@deeprastore/infrastructure/src/db/client';
import { orders, enquiries, enquiryQuotes } from '@deeprastore/infrastructure/src/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { CustomerDashboard } from '@/components/customer-dashboard';

export const dynamic = "force-dynamic";

export default async function MagicLinkTrackPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  if (!token || token.length < 10) {
    redirect('/track');
  }

  // 1. Search in active orders table
  const matchingOrders = await db.select()
    .from(orders)
    .where(
      and(
        eq(orders.trackingToken, token),
        eq(orders.isDeleted, false)
      )
    );

  if (matchingOrders.length > 0) {
    // Found order: Render CustomerDashboard with the order
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <CustomerDashboard orders={matchingOrders} phone="" isMagicLink={true} />
      </div>
    );
  }

  // 2. Search in enquiries table with left join on quotes
  const matchingEnquiriesResult = await db.select({
    enquiry: enquiries,
    quote: enquiryQuotes
  })
    .from(enquiries)
    .leftJoin(enquiryQuotes, eq(enquiries.currentQuoteId, enquiryQuotes.id))
    .where(eq(enquiries.trackingToken, token));

  if (matchingEnquiriesResult.length > 0) {
    const matchingEnquiries = matchingEnquiriesResult.map(r => ({
      ...r.enquiry,
      quote: r.quote
    }));

    // Found request/enquiry: Render CustomerDashboard with the request
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <CustomerDashboard enquiries={matchingEnquiries} phone="" isMagicLink={true} />
      </div>
    );
  }

  // 3. Fallback: Redirect to general tracking login
  redirect('/track');
}
