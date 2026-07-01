'use server';

import { db } from '@deeprastore/infrastructure';
import { orders, orderLineItems, enquiries, customers, payments, customerAddresses, measurementsHistory, enquiryQuotes, enquiryComments, auditLogs } from '@deeprastore/infrastructure/src/schema';
import { eq, and, desc, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { notifyOrderCreated, notifyPaymentReceived } from './notifications';
import { v4 as uuidv4 } from 'uuid';

const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    // Ignore static generation store missing error outside next.js web runtime
  }
}

import { requireStaffAuth } from './auth';

export async function getPendingEnquiries() {
  try {
    await requireStaffAuth();
    const result = await db.select({
      enquiry: enquiries,
      quote: enquiryQuotes
    })
      .from(enquiries)
      .leftJoin(enquiryQuotes, eq(enquiries.currentQuoteId, enquiryQuotes.id))
      .where(and(
        eq(enquiries.tenantId, MOCK_TENANT_ID),
        ne(enquiries.status, 'CONVERTED'),
        ne(enquiries.status, 'CLOSED')
      ))
      .orderBy(desc(enquiries.createdAt));
    
    // Map to include quote details nested inside enquiry object
    return result.map(row => ({
      ...row.enquiry,
      quote: row.quote
    }));
  } catch (error) {
    console.error('Failed to get enquiries:', error);
    return [];
  }
}

export async function convertEnquiryToOrder(enquiryId: string) {
  try {
    await requireStaffAuth();
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, enquiryId));
    if (!enquiry) return { error: 'Enquiry not found' };

    return { success: true, enquiry };
  } catch (error) {
    return { error: 'Failed to convert enquiry' };
  }
}

export async function updateEnquiryStatusAction(
  enquiryId: string, 
  status: string, 
  assignedTo?: string, 
  advancePaymentProofUrl?: string,
  quoteData?: {
    quoteAmount: string;
    requiredAdvance: string;
    basePrice?: string;
    discountAmount?: string;
    deliveryAmount?: string;
    deliveryType?: string;
    quoteNotes?: string;
    invoiceUrl?: string;
    expiresAt?: string;
  },
  utr?: string
) {
  try {
    await requireStaffAuth();
    const [enqBefore] = await db.select().from(enquiries).where(eq(enquiries.id, enquiryId));
    const beforeStatus = enqBefore ? enqBefore.status : 'REQUEST';

    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }
    if (advancePaymentProofUrl !== undefined) {
      updateData.advancePaymentProofUrl = advancePaymentProofUrl;
    }
    if (utr !== undefined) {
      updateData.utr = utr;
    }

    if (quoteData && quoteData.quoteAmount) {
      const existingQuotes = await db.select()
        .from(enquiryQuotes)
        .where(eq(enquiryQuotes.enquiryId, enquiryId))
        .orderBy(desc(enquiryQuotes.version));
      
      const newVersion = existingQuotes.length > 0 ? existingQuotes[0].version + 1 : 1;
      const quoteId = uuidv4();

      let paymentLinkUrl = null;

      // Generate Razorpay Payment Link if credentials are set and advance is required
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && Number(quoteData.requiredAdvance) > 0) {
        try {
          const Razorpay = require('razorpay');
          const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });

          // Razorpay expects amount in paise (multiply by 100)
          const amountInPaise = Math.round(Number(quoteData.requiredAdvance) * 100);

          const paymentLink = await rzp.paymentLink.create({
            amount: amountInPaise,
            currency: "INR",
            accept_partial: false,
            description: `Advance Payment for Request ${enqBefore?.enquiryNumber || 'N/A'}`,
            customer: {
              name: enqBefore?.customerName || "Customer",
              contact: enqBefore?.customerPhone || "",
              email: enqBefore?.email || ""
            },
            notify: {
              sms: true,
              email: true
            },
            reminder_enable: true,
            reference_id: enquiryId,
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${enqBefore?.trackingToken}`,
            callback_method: "get"
          });

          paymentLinkUrl = paymentLink.short_url;
        } catch (rzpErr) {
          console.error("Failed to generate Razorpay link:", rzpErr);
          // Non-fatal, we just continue without a link
        }
      }

      await db.insert(enquiryQuotes).values({
        id: quoteId,
        enquiryId,
        version: newVersion,
        quoteAmount: quoteData.quoteAmount,
        requiredAdvance: quoteData.requiredAdvance || '0',
        basePrice: quoteData.basePrice || null,
        discountAmount: quoteData.discountAmount || null,
        deliveryAmount: quoteData.deliveryAmount || null,
        deliveryType: quoteData.deliveryType || null,
        paymentLinkUrl: paymentLinkUrl,
        quoteNotes: quoteData.quoteNotes || null,
        invoiceUrl: quoteData.invoiceUrl || null,
        expiresAt: quoteData.expiresAt ? new Date(quoteData.expiresAt) : null,
        createdBy: assignedTo || 'Staff',
        statusSnapshot: status,
        createdFromStatus: beforeStatus,
      });

      updateData.currentQuoteId = quoteId;
    }

    await db.update(enquiries)
      .set(updateData)
      .where(eq(enquiries.id, enquiryId));

    if (status !== beforeStatus) {
      await logAuditEvent('enquiries', enquiryId, 'Status Changed', { status: beforeStatus }, { status: status }, assignedTo || 'System');
    }

    safeRevalidatePath('/pilot/order-desk');
    const [enq] = await db.select().from(enquiries).where(eq(enquiries.id, enquiryId));
    if (enq && enq.trackingToken) {
      safeRevalidatePath(`/track/${enq.trackingToken}`);
    }
    safeRevalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update enquiry status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}

export async function updateEnquiryDetailsAction(enquiryId: string, data: any) {
  try {
    await requireStaffAuth();
    
    // We update the basic fields
    // For legacy fields in notes (product name, code, advance, order date), we reconstruct the notes.
    const metadata = [];
    if (data.productName) metadata.push(`Product Name: ${data.productName}`);
    if (data.productCode) metadata.push(`Product Code: ${data.productCode}`);
    if (data.advanceAmount) metadata.push(`Advance Amount: ₹${data.advanceAmount}`);
    if (data.orderDate) metadata.push(`Order Date: ${data.orderDate}`);
    if (data.utr) metadata.push(`Payment UTR: ${data.utr}`);
    
    let finalNotes = data.notes || '';
    if (metadata.length > 0) {
      finalNotes = metadata.join('\n') + (finalNotes ? '\n\n' + finalNotes : '');
    }

    await db.update(enquiries)
      .set({
        customerName: data.name,
        customerPhone: data.phone,
        email: data.email || null,
        address: data.address || null,
        productType: data.productType,
        expectedDeliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        notes: finalNotes,
        updatedAt: new Date(),
        measurements: data.measurements || null,
        referenceImages: data.attachments !== undefined ? data.attachments.map((a: any) => a.url) : undefined,
      })
      .where(eq(enquiries.id, enquiryId));

    safeRevalidatePath('/pilot/order-desk');
    return { success: true };
  } catch (error) {
    console.error('Failed to update enquiry details:', error);
    return { success: false, error: 'Failed to save changes' };
  }
}

export async function addEnquiryCommentAction(enquiryId: string, staffName: string, comment: string) {
  try {
    await db.insert(enquiryComments).values({
      enquiryId,
      staffName,
      comment,
    });
    safeRevalidatePath('/pilot/order-desk');
    const [enq] = await db.select().from(enquiries).where(eq(enquiries.id, enquiryId));
    if (enq && enq.trackingToken) {
      safeRevalidatePath(`/track/${enq.trackingToken}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to add comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

export async function getEnquiryCommentsAction(enquiryId: string) {
  try {
    const result = await db.select()
      .from(enquiryComments)
      .where(eq(enquiryComments.enquiryId, enquiryId))
      .orderBy(desc(enquiryComments.createdAt));
    return result;
  } catch (error) {
    console.error('Failed to get comments:', error);
    return [];
  }
}

export async function submitCustomerResponseAction(
  enquiryId: string,
  responseType: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
  notes?: string,
  advancePaymentProofUrl?: string
) {
  try {
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, enquiryId));
    if (!enquiry) {
      return { success: false, error: 'Request not found' };
    }

    const updateData: any = {
      customerResponse: responseType,
      customerResponseNotes: notes || null,
      updatedAt: new Date()
    };

    if (responseType === 'APPROVED') {
      updateData.status = 'PAYMENT_RECEIVED';
      if (advancePaymentProofUrl) {
        updateData.advancePaymentProofUrl = advancePaymentProofUrl;
      }
    } else if (responseType === 'REJECTED') {
      updateData.status = 'REJECTED';
    } else if (responseType === 'CHANGES_REQUESTED') {
      updateData.status = 'CHANGES_REQUESTED';
    }

    await db.update(enquiries)
      .set(updateData)
      .where(eq(enquiries.id, enquiryId));

    safeRevalidatePath('/pilot/order-desk');
    if (enquiry.trackingToken) {
      safeRevalidatePath(`/track/${enquiry.trackingToken}`);
    }
    safeRevalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to submit customer response:', error);
    return { success: false, error: 'Failed to save your response' };
  }
}

export async function createUnifiedOrderAction(data: any) {
  try {
    let orderResult: any;
    let paymentAmount = 0;
    
    await db.transaction(async (tx) => {
      // 1. Find or create customer
      let customerId = data.customerId;
      
      if (!customerId) {
        // Try to find by phone
        const existing = await tx.select().from(customers).where(eq(customers.phone, data.phone));
        if (existing.length > 0) {
          customerId = existing[0].id;
        } else {
          // Create new
          const [newCust] = await tx.insert(customers).values({
            tenantId: MOCK_TENANT_ID,
            name: data.name,
            phone: data.phone,
          }).returning();
          customerId = newCust.id;
        }
      }

      // Update email on customer if not set
      if (data.email) {
        await tx.update(customers)
          .set({ email: data.email })
          .where(eq(customers.id, customerId));
      }

      // Check and save customer address
      if (data.address) {
        const existingAddr = await tx.select().from(customerAddresses).where(eq(customerAddresses.customerPhone, data.phone));
        if (existingAddr.length > 0) {
          await tx.update(customerAddresses)
            .set({ addressLine1: data.address, updatedAt: new Date() })
            .where(eq(customerAddresses.customerPhone, data.phone));
        } else {
          await tx.insert(customerAddresses).values({
            id: uuidv4(),
            tenantId: MOCK_TENANT_ID,
            customerPhone: data.phone,
            fullName: data.name,
            addressLine1: data.address,
            city: 'Not Set',
            state: 'Not Set',
            postalCode: '000000',
            country: 'India',
          });
        }
      }

      // Check for enquiry details to inherit token or save measurements
      let trackingToken = uuidv4(); // Default token
      
      if (data.enquiryId) {
        const [enquiry] = await tx.select().from(enquiries).where(eq(enquiries.id, data.enquiryId));
        if (enquiry) {
          if (enquiry.trackingToken) {
            trackingToken = enquiry.trackingToken; // Inherit the same tracking token forever!
          }
          if (enquiry.measurements) {
            // Save measurements to history
            const m = enquiry.measurements as any;
            await tx.insert(measurementsHistory).values({
              id: uuidv4(),
              customerId: customerId,
              customerPhone: data.phone,
              bust: m.blouse?.bust || m.kurta?.chest || null,
              waist: m.lehenga?.waist || m.blouse?.waist || m.kurta?.waist || null,
              hip: m.lehenga?.hip || m.kurta?.hip || null,
              height: m.lehenga?.length || m.kurta?.length || null,
              customFields: m,
              recordedAt: new Date(),
            });
          }
        }
      }

      const orderNumber = `DP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const hasPayment = data.advanceAmount && Number(data.advanceAmount) > 0;
      const initialStatus = hasPayment ? 'PENDING_VERIFICATION' : 'DRAFT';
      const initialPaymentStatus = hasPayment ? 'VERIFICATION_PENDING' : 'UNPAID';

      // 3. Create Order
      const [newOrder] = await tx.insert(orders).values({
        tenantId: MOCK_TENANT_ID,
        customerId: customerId,
        customerPhone: data.phone,
        customerName: data.name,
        source: data.source,
        orderCategory: data.orderType,
        primaryImageUrl: data.attachments?.[0]?.url || '',
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDeliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        measurementStatus: data.measurementStatus,
        fabricSource: data.fabricSource,
        fabricDetails: data.fabricDetails,
        attachments: data.attachments,
        totalAmount: data.totalAmount?.toString() || '0',
        advanceAmount: data.advanceAmount?.toString() || '0',
        balanceAmount: data.balanceAmount?.toString() || '0',
        basePrice: data.basePrice?.toString() || null,
        discountAmount: data.discountAmount?.toString() || null,
        deliveryAmount: data.deliveryAmount?.toString() || null,
        deliveryType: data.deliveryType || null,
        paymentMethod: data.paymentMethod,
        utrNumber: data.utrNumber || null,
        paymentProofUrl: data.attachments?.[0]?.url || data.paymentProofUrl || null,
        notes: data.notes,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        orderNumber,
        trackingToken, // Inherited or generated UUID
      }).returning();
      
      orderResult = newOrder;

      // 4. Create Line Items
      if (data.lineItems && data.lineItems.length > 0) {
        await tx.insert(orderLineItems).values(
          data.lineItems.map((item: any) => ({
            tenantId: MOCK_TENANT_ID,
            orderId: newOrder.id,
            productId: item.productId || item.name, // Fallback name to productId for now
            quantity: item.quantity,
            price: item.price.toString() || '0',
            status: 'PENDING'
          }))
        );
      }

      // 4. Update Enquiry Status if this came from an enquiry
      if (data.enquiryId) {
        await tx.update(enquiries)
          .set({ status: 'CONVERTED', orderId: newOrder.id })
          .where(eq(enquiries.id, data.enquiryId));
      }

      // 5. Create Payment Record if advance is paid
      if (hasPayment) {
        paymentAmount = Number(data.advanceAmount);
        await tx.insert(payments).values({
          orderId: newOrder.id,
          amount: data.advanceAmount.toString(),
          utr: data.utrNumber || null,
          screenshotUrl: data.attachments?.[0]?.url || data.paymentProofUrl || null,
          status: 'PENDING',
        });
      }
    });
    
    if (orderResult) {
      await logAuditEvent('orders', orderResult.id, 'Order Created', null, orderResult, data.assignedStaff || 'System');
      notifyOrderCreated(orderResult.customerPhone, orderResult.id, Number(orderResult.totalAmount), Number(orderResult.advanceAmount)).catch(console.error);
      if (paymentAmount > 0) {
        await logAuditEvent('payments', orderResult.id, 'Payment Logged', null, { amount: paymentAmount, utr: data.utrNumber }, data.assignedStaff || 'System');
        notifyPaymentReceived(orderResult.customerPhone, orderResult.id, paymentAmount).catch(console.error);
      }
    }

    safeRevalidatePath('/pilot/order-desk');
    safeRevalidatePath('/production');
    safeRevalidatePath('/dispatch');
    safeRevalidatePath('/');
    
    return { 
      success: true, 
      order: {
        id: orderResult.id,
        orderNumber: orderResult.orderNumber,
        customerName: orderResult.customerName,
        customerPhone: orderResult.customerPhone,
        totalAmount: orderResult.totalAmount,
        advanceAmount: orderResult.advanceAmount,
        balanceAmount: orderResult.balanceAmount,
        expectedDeliveryDate: orderResult.expectedDeliveryDate,
      }
    };
  } catch (error) {
    console.error('Failed to create order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

export async function logAuditEvent(tableName: string, recordId: string, action: string, oldData?: any, newData?: any, staffId: string = 'System') {
  try {
    await db.insert(auditLogs).values({
      tableName,
      recordId,
      action,
      oldData,
      newData,
      staffId
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function getOrderDetailsByNumberAction(orderNumber: string) {
  try {
    await requireStaffAuth();
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    if (!order) return null;

    const [customer] = order.customerId ? await db.select().from(customers).where(eq(customers.id, order.customerId as string)) : [null];
    const lines = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, order.id));
    const pays = await db.select().from(payments).where(eq(payments.orderId, order.id));

    return { order, customer, lineItems: lines, payments: pays };
  } catch (err) {
    console.error('Failed to get order details by number', err);
    return null;
  }
}

export async function getOrderAuditLogsAction(recordId: string) {
  try {
    await requireStaffAuth();
    return await db.select().from(auditLogs).where(eq(auditLogs.recordId, recordId)).orderBy(desc(auditLogs.createdAt));
  } catch (err) {
    console.error('Failed to get audit logs', err);
    return [];
  }
}
