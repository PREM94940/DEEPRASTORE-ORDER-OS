
import { NotificationService } from '@deeprastore/infrastructure/src/services/notification_service';

export interface SMSProvider {
  sendSMS(to: string, message: string): Promise<boolean>;
  sendWhatsApp(to: string, message: string, templateId?: string): Promise<boolean>;
}

export class MockSMSProvider implements SMSProvider {
  async sendSMS(to: string, message: string): Promise<boolean> {
    console.log(`[MockSMSProvider] Sending SMS to ${to}: ${message}`);
    return true;
  }

  async sendWhatsApp(to: string, message: string, templateId?: string): Promise<boolean> {
    if (to === '+919999999999') {
      console.log(`[MockSMSProvider] SIMULATED FAILURE for ${to}`);
      throw new Error('Provider unavailable or API rate limit exceeded');
    }
    console.log(`[MockSMSProvider] Sending WhatsApp to ${to} [Template: ${templateId}]: ${message}`);
    return true;
  }
}

export const smsProvider = new MockSMSProvider();

export const NotificationTemplates = {
  ORDER_CREATED: (orderNumber: string, amount: number, advance: number) => 
    `Hello! Your order ${orderNumber} has been successfully created. Total: ₹${amount}. Advance Received: ₹${advance}. Thank you for choosing us!`,
    
  ORDER_READY: (orderNumber: string) => 
    `Great news! Your order ${orderNumber} is READY for dispatch/pickup.`,
    
  ORDER_DISPATCHED: (orderNumber: string, courierName: string, trackingId: string) => 
    `Your order ${orderNumber} has been dispatched via ${courierName}. Tracking ID: ${trackingId}.`,
    
  PAYMENT_RECEIVED: (orderNumber: string, amount: number) => 
    `We have received a payment of ₹${amount} for your order ${orderNumber}. Thank you!`
};

import { logSystemAlert } from './monitoring';

export async function notifyOrderCreated(phone: string, orderNumber: string, totalAmount: number, advanceAmount: number) {
  try {
    const messageBody = NotificationTemplates.ORDER_CREATED(orderNumber, totalAmount, advanceAmount);
    await NotificationService.queueMessage({ channel: 'WHATSAPP', recipient: phone, customerPhone: phone, messageTemplateId: 'ORDER_CREATED', messageBody });
    await smsProvider.sendWhatsApp(phone, messageBody, 'ORDER_CREATED');
  } catch (error: any) {
    console.error('Notification failed:', error);
    await logSystemAlert('WARNING', 'SMS', `Failed to send ORDER_CREATED to ${phone}`, { error: error.message });
  }
}

export async function notifyOrderReady(phone: string, orderNumber: string) {
  const messageBody = NotificationTemplates.ORDER_READY(orderNumber);
  await NotificationService.queueMessage({ channel: 'WHATSAPP', recipient: phone, customerPhone: phone, messageTemplateId: 'ORDER_READY', messageBody });
  await smsProvider.sendWhatsApp(phone, messageBody, 'ORDER_READY');
}

export async function notifyOrderDispatched(phone: string, orderNumber: string, courierName: string, trackingId: string) {
  const messageBody = NotificationTemplates.ORDER_DISPATCHED(orderNumber, courierName, trackingId);
  await NotificationService.queueMessage({ channel: 'WHATSAPP', recipient: phone, customerPhone: phone, messageTemplateId: 'ORDER_DISPATCHED', messageBody });
  await smsProvider.sendWhatsApp(phone, messageBody, 'ORDER_DISPATCHED');
}

export async function notifyPaymentReceived(phone: string, orderNumber: string, amount: number) {
  const messageBody = NotificationTemplates.PAYMENT_RECEIVED(orderNumber, amount);
  await NotificationService.queueMessage({ channel: 'WHATSAPP', recipient: phone, customerPhone: phone, messageTemplateId: 'PAYMENT_RECEIVED', messageBody });
  await smsProvider.sendWhatsApp(phone, messageBody, 'PAYMENT_RECEIVED');
}
