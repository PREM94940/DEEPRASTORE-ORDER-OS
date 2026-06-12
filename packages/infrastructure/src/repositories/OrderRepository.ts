import { eq, and, or } from 'drizzle-orm';
import { db } from '../db/client';
import { orders, orderLineItems, orderAddresses } from '../schema/order';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhone } from '../../../core-domain/src/utils/phone';
import { 
  IOrderRepository, 
  CreateOrderDTO, 
  CreateOrderLineItemDTO, 
  CreateOrderAddressDTO 
} from '../../../core-domain/src/order/repositories/IOrderRepository';
import { Order, OrderLineItem, OrderAddress } from '../../../core-domain/src/order/domain/models/OrderModels';

export class OrderRepository implements IOrderRepository {
  async createOrder(tx: any, data: CreateOrderDTO): Promise<Order> {
    const id = uuidv4();
    const client = tx || db;
    await client.insert(orders).values({
      id,
      tenantId: data.tenantId,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      customerPhone: normalizePhone(data.customerPhone),
      source: data.source || 'WHATSAPP',
      orderType: data.orderType || 'READY',
      paymentMethod: data.paymentMethod || null,
      status: data.status || 'PENDING',
      totalAmount: data.totalAmount?.toString() || null,
      expectedDeliveryDate: data.expectedDeliveryDate || null,
    });
    
    const result = await client.select().from(orders).where(eq(orders.id, id));
    const raw = result[0];
    return {
        ...raw,
        totalAmount: raw.totalAmount ? parseFloat(raw.totalAmount as string) : null
    } as unknown as Order;
  }

  async getOrderById(tenantId: string, id: string): Promise<Order | null> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    if (!result.length || result[0].tenantId !== tenantId) return null;
    const raw = result[0];
    return {
        ...raw,
        totalAmount: raw.totalAmount ? parseFloat(raw.totalAmount as string) : null
    } as unknown as Order;
  }

  async updateOrderStatus(tx: any, tenantId: string, id: string, status: string): Promise<Order> {
    const client = tx || db;
    await client.update(orders).set({ status }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    const order = await this.getOrderById(tenantId, id);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async updatePaymentUTR(tx: any, tenantId: string, id: string, utrNumber: string): Promise<Order> {
    const client = tx || db;
    await client.update(orders).set({ 
      paymentStatus: 'VERIFICATION_PENDING', 
      utrNumber 
    }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    const order = await this.getOrderById(tenantId, id);
    if (!order) throw new Error('Order not found');
    return order;
  }

  async verifyPayment(tx: any, tenantId: string, id: string, staffName: string): Promise<Order> {
    const client = tx || db;
    await client.update(orders).set({ 
      paymentStatus: 'VERIFIED',
      status: 'CONFIRMED',
      verificationStaff: staffName,
      verificationTime: new Date()
    }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    return this.getOrderById(tenantId, id) as any;
  }

  async rejectPayment(tx: any, tenantId: string, id: string): Promise<Order> {
    const client = tx || db;
    await client.update(orders).set({ 
      paymentStatus: 'REJECTED',
      status: 'CANCELLED'
    }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    return this.getOrderById(tenantId, id) as any;
  }

  async getPaymentsForVerification(tenantId: string) {
    const result = await db.select().from(orders).where(eq(orders.tenantId, tenantId));
    return result.filter(o => o.paymentStatus === 'VERIFICATION_PENDING' || o.paymentStatus === 'VERIFIED');
  }

  async getProductionQueue(tenantId: string) {
    const result = await db.select().from(orders).where(
      and(
        eq(orders.tenantId, tenantId),
        eq(orders.paymentStatus, 'VERIFIED'),
        or(
          eq(orders.status, 'CONFIRMED'),
          eq(orders.status, 'STITCHING')
        )
      )
    );
    return result;
  }

  async updateOrderProductionStatus(tx: any, tenantId: string, id: string, newStatus: string): Promise<Order> {
    const order = await this.getOrderById(tenantId, id);
    if (!order) throw new Error('Order not found');

    const validTransitions: Record<string, string[]> = {
      'PENDING': ['STITCHING'],
      'CONFIRMED': ['STITCHING', 'PENDING'],
      'STITCHING': ['READY'],
      'READY': ['DELIVERED'],
      'DELIVERED': []
    };

    const currentStatus = order.status;
    
    // Check if transition is valid
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid state transition from ${currentStatus} to ${newStatus}`);
    }

    const client = tx || db;
    await client.update(orders).set({ 
      status: newStatus,
      updatedAt: new Date()
    }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    
    return this.getOrderById(tenantId, id) as any;
  }

  async getOrdersByPhone(tenantId: string, phone: string) {
    const normalizedPhone = normalizePhone(phone);
    return await db.select().from(orders).where(
      and(
        eq(orders.tenantId, tenantId),
        eq(orders.customerPhone, normalizedPhone)
      )
    );
  }

  async getAllOrders(tenantId: string) {
    return await db.select().from(orders).where(
      eq(orders.tenantId, tenantId)
    );
  }

  async createSupportTicket(tx: any, tenantId: string, id: string, issueType: string, description: string, evidenceUrl: string): Promise<Order> {
    if (!evidenceUrl || evidenceUrl.trim() === '') {
      throw new Error('NO EVIDENCE = NO TICKET');
    }
    const client = tx || db;
    await client.update(orders).set({
      exceptionReason: issueType,
      exceptionDescription: description,
      exceptionEvidenceUrl: evidenceUrl,
      exceptionStatus: 'OPEN',
      exceptionRaisedDate: new Date()
    }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));

    return this.getOrderById(tenantId, id) as any;
  }

  async getOpenExceptions(tenantId: string) {
    return await db.select().from(orders).where(
      and(
        eq(orders.tenantId, tenantId),
        eq(orders.exceptionStatus, 'OPEN')
      )
    );
  }

  async addLineItem(tx: any, data: CreateOrderLineItemDTO): Promise<OrderLineItem> {
    const id = uuidv4();
    const client = tx || db;
    await client.insert(orderLineItems).values({
      id,
      tenantId: data.tenantId,
      orderId: data.orderId,
      productVariantId: data.productVariantId || null,
      quantity: data.quantity,
      price: data.price.toString(),
    });
    const result = await client.select().from(orderLineItems).where(eq(orderLineItems.id, id));
    const raw = result[0];
    return {
        ...raw,
        price: parseFloat(raw.price as string)
    } as unknown as OrderLineItem;
  }

  async getLineItemsByOrderId(tenantId: string, orderId: string): Promise<OrderLineItem[]> {
    const result = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, orderId));
    return result.filter((i: any) => i.tenantId === tenantId).map((raw: any) => ({
        ...raw,
        price: parseFloat(raw.price as string)
    })) as unknown as OrderLineItem[];
  }

  async addAddress(tx: any, data: CreateOrderAddressDTO): Promise<OrderAddress> {
    const id = uuidv4();
    const client = tx || db;
    await client.insert(orderAddresses).values({
      id,
      ...data,
      phone: data.phone || null,
      addressLine2: data.addressLine2 || null,
    });
    const result = await client.select().from(orderAddresses).where(eq(orderAddresses.id, id));
    return result[0] as unknown as OrderAddress;
  }

  async getAddressByOrderId(tenantId: string, orderId: string): Promise<OrderAddress | null> {
    const result = await db.select().from(orderAddresses).where(eq(orderAddresses.orderId, orderId));
    if (!result.length || result[0].tenantId !== tenantId) return null;
    return result[0] as unknown as OrderAddress;
  }
}
