import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@deeprastore/infrastructure/src/db/client';
import { enquiries, enquiryComments } from '@deeprastore/infrastructure/src/schema/enquiry';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.link.paid') {
      const paymentLink = event.payload.payment_link.entity;
      const enquiryId = paymentLink.reference_id; // We passed enquiryId as reference_id
      const paymentId = paymentLink.payment_id || 'N/A';
      
      if (!enquiryId) {
        return NextResponse.json({ error: 'No reference_id in payment link' }, { status: 400 });
      }

      // Check if enquiry exists
      const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, enquiryId));
      if (!enquiry) {
        return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
      }

      // Automatically update status to PAYMENT_RECEIVED as requested
      await db.update(enquiries)
        .set({
          status: 'PAYMENT_RECEIVED',
          updatedAt: new Date()
        })
        .where(eq(enquiries.id, enquiryId));

      // Add a system comment to the enquiry so staff knows it was paid via Razorpay
      await db.insert(enquiryComments).values({
        id: uuidv4(),
        enquiryId,
        staffName: 'System (Automated)',
        comment: `✅ Razorpay Payment Received! Payment ID: ${paymentId}. Status updated to PAYMENT_RECEIVED.`,
      });

      return NextResponse.json({ success: true });
    }

    // Acknowledge other events without action
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
