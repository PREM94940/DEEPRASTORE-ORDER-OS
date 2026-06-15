import { db } from '../db/client';
import { notificationQueue } from '../schema/notifications';
import { eq } from 'drizzle-orm';

export const NotificationService = {
  async queueMessage({
    channel,
    recipient,
    customerPhone,
    messageTemplateId,
    messageBody,
  }: {
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
    recipient: string;
    customerPhone?: string;
    messageTemplateId?: string;
    messageBody: string;
  }) {
    const [queued] = await db.insert(notificationQueue).values({
      channel,
      recipient,
      customerPhone,
      messageTemplateId,
      messageBody,
      status: 'PENDING',
    }).returning();
    return queued;
  },

  async processPendingMessages() {
    // In reality, this would be a cron job or a background worker
    const pending = await db.select().from(notificationQueue).where(eq(notificationQueue.status, 'PENDING')).limit(50);
    
    for (const msg of pending) {
      try {
        // Simulate sending logic via a 3rd party API (e.g. Twilio, Gupshup, Resend)
        console.log(`Sending ${msg.channel} to ${msg.recipient}: ${msg.messageBody}`);
        
        await db.update(notificationQueue)
          .set({ status: 'SENT', sentAt: new Date() })
          .where(eq(notificationQueue.id, msg.id));
      } catch (err: any) {
        await db.update(notificationQueue)
          .set({ status: 'FAILED', errorDetails: err.message })
          .where(eq(notificationQueue.id, msg.id));
      }
    }
  }
};
