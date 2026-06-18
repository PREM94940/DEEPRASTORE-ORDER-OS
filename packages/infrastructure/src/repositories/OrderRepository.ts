import { eq, and, or, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { orders, orderLineItems, orderAddresses, payments } from '../schema/order';
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

  async generateOrderNumber(client: any, tenantId: string): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const result = await client.select({ count: sql`count(*)` }).from(orders).where(sql`tenant_id = ${tenantId} AND extract(year from created_at) = extract(year from current_date)`);
    const count = parseInt(result[0].count as string) || 0;
    const nextSeq = (count + 1).toString().padStart(4, '0');
    return `DP${year}${nextSeq}`;
  }

  async createOrder(tx: any, data: CreateOrderDTO): Promise<Order> {
    const id = uuidv4();
    const client = tx || db;
    const orderNumber = await this.generateOrderNumber(client, data.tenantId);
    
    await client.insert(orders).values({
      id,
      tenantId: data.tenantId,
      orderNumber,
      customerId: data.customerId || null,
      customerName: data.customerName || null,
      customerPhone: normalizePhone(data.customerPhone),
      source: data.source || 'WHATSAPP',
      orderCategory: data.orderCategory || data.orderType || 'READY_MADE',
      paymentMethod: data.paymentMethod || null,
      status: data.status || 'PENDING',
      totalAmount: data.totalAmount?.toString() || null,
      expectedDeliveryDate: data.expectedDeliveryDate || null,
      createdAt: data.createdAt || new Date(), // Allow overriding date
    } as any);
    
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

  async updateOrderDetails(tx: any, tenantId: string, id: string, data: Partial<CreateOrderDTO>): Promise<Order> {
    const client = tx || db;
    
    // Extract valid columns for the orders table update
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (data.status !== undefined) updateData.status = data.status;
    if (data.expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = data.expectedDeliveryDate;
    if (data.notes !== undefined) updateData.notes = data.notes; 
    
    if (data.courierName !== undefined) updateData.courierName = data.courierName;
    if (data.trackingId !== undefined) updateData.trackingId = data.trackingId;
    if (data.trackingUrl !== undefined) updateData.trackingUrl = data.trackingUrl;
    if (data.dispatchDate !== undefined) updateData.dispatchDate = data.dispatchDate;
    if (data.orderType !== undefined) updateData.orderType = data.orderType;
    if (data.source !== undefined) updateData.source = data.source;

    await client.update(orders).set(updateData).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    
    const order = await this.getOrderById(tenantId, id);
    if (!order) throw new Error('Order not found');
    return order;
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
      status: 'PENDING_VERIFICATION',
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
      status: 'PAYMENT_REJECTED'
    }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    return this.getOrderById(tenantId, id) as any;
  }

  async addPayment(tx: any, tenantId: string, orderId: string, amount: number, staffId: string, utr: string): Promise<void> {
    const client = tx || db;
    await client.insert(payments).values({
      id: uuidv4(),
      orderId,
      amount: amount.toString(),
      utr,
      status: 'PENDING',
      createdAt: new Date(),
    });
  }

  async getPaymentsForVerification(tenantId: string) {
    const result = await db.select().from(orders).where(eq(orders.tenantId, tenantId));
    return result.filter(o => o.paymentStatus === 'VERIFICATION_PENDING' || o.paymentStatus === 'VERIFIED' || o.paymentStatus === 'REJECTED');
  }

  async getProductionQueue(tenantId: string) {
    const result = await db.select().from(orders).where(
      and(
        eq(orders.tenantId, tenantId),
        eq(orders.paymentStatus, 'VERIFIED'),
        or(
          eq(orders.status, 'CONFIRMED'),
          eq(orders.status, 'CUTTING'),
          eq(orders.status, 'STITCHING'),
          eq(orders.status, 'QC'),
          eq(orders.status, 'READY_TO_SHIP')
        )
      )
    );
    return result;
  }

  // CANONICAL STATE MACHINE (Source of Truth)
  readonly validTransitions: Record<string, string[]> = {
    'DRAFT': ['PENDING_VERIFICATION', 'CANCELLED'],
    'PENDING_VERIFICATION': ['CONFIRMED', 'PAYMENT_REJECTED', 'CANCELLED'],
    'PAYMENT_REJECTED': ['PENDING_VERIFICATION', 'CANCELLED'],
    'CONFIRMED': ['CUTTING', 'HOLD', 'CANCELLED'],
    'CUTTING': ['STITCHING', 'HOLD', 'CANCELLED'],
    'STITCHING': ['QC', 'HOLD', 'CANCELLED'],
    'QC': ['READY_TO_SHIP', 'HOLD', 'CANCELLED'],
    'READY_TO_SHIP': ['DISPATCHED', 'HOLD', 'CANCELLED'],
    'DISPATCHED': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [],
    'CANCELLED': [],
    'HOLD': ['CONFIRMED', 'CUTTING', 'STITCHING', 'QC', 'READY_TO_SHIP', 'CANCELLED']
  };

  async updateOrderProductionStatus(tx: any, tenantId: string, id: string, newStatus: string): Promise<Order> {
    const order = await this.getOrderById(tenantId, id);
    if (!order) throw new Error('Order not found');

    const currentStatus = order.status || 'DRAFT';
    
    // Check if transition is valid
    if (currentStatus !== newStatus && !this.validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid state transition from ${currentStatus} to ${newStatus}`);
    }

    // Strict Gatekeeper Rule: payment must be verified before entering CUTTING, STITCHING, QC, READY_TO_SHIP
    if (['CUTTING', 'STITCHING', 'QC', 'READY_TO_SHIP'].includes(newStatus)) {
      if (order.paymentStatus !== 'VERIFIED') {
        throw new Error('Payment must be verified before production can begin.');
      }
    }

    const client = tx || db;
    const updateFields: any = {
      status: newStatus,
      updatedAt: new Date()
    };

    // Keep old production/dispatch columns in sync if they are production/dispatch stages
    if (['CUTTING', 'STITCHING', 'QC', 'READY_TO_SHIP', 'HOLD'].includes(newStatus)) {
      updateFields.productionStatus = newStatus === 'QC' ? 'QC_PENDING' : newStatus;
    }
    if (['DISPATCHED', 'DELIVERED'].includes(newStatus)) {
      updateFields.dispatchStatus = newStatus;
    }

    await client.update(orders).set(updateFields).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
    
    return this.getOrderById(tenantId, id) as any;
  }

  async updateOrderProductionStatusWithAudit(tx: any, tenantId: string, id: string, newStatus: string, reason: string, staffId: string): Promise<Order> {
    const client = tx || db;
    const order = await this.getOrderById(tenantId, id);
    if (!order) throw new Error('Order not found');
    
    const oldStatus = order.status;
    const updatedOrder = await this.updateOrderProductionStatus(client, tenantId, id, newStatus);
    
    // Write to audit_logs table
    await client.execute(sql`
      INSERT INTO audit_logs (id, table_name, record_id, action, old_data, new_data, staff_id, created_at)
      VALUES (
        gen_random_uuid(),
        'orders',
        ${id},
        'PRODUCTION_STATUS_UPDATE',
        ${JSON.stringify({ status: oldStatus })},
        ${JSON.stringify({ status: newStatus, reason })},
        ${staffId},
        now()
      )
    `);

    return updatedOrder;
  }

  async updateOrderDispatchStatusWithAudit(tx: any, tenantId: string, id: string, newStatus: string, staffId: string, details?: any): Promise<Order> {
    const client = tx || db;
    const order = await this.getOrderById(tenantId, id);
    if (!order) throw new Error('Order not found');

    const currentStatus = order.status || 'DRAFT';
    if (currentStatus !== newStatus && !this.validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid dispatch transition from ${currentStatus} to ${newStatus}`);
    }

    // Require courierName and trackingId if transitioning to DISPATCHED
    if (newStatus === 'DISPATCHED' && (!details?.courierName || !details?.trackingId)) {
      throw new Error('Courier Name and Tracking ID are mandatory for dispatching.');
    }

    const updateData: any = {
      status: newStatus,
      dispatchStatus: newStatus,
      updatedAt: new Date()
    };

    if (details) {
      if (details.courierName) updateData.courierName = details.courierName;
      if (details.trackingId) updateData.trackingId = details.trackingId;
      if (details.dispatchDate) updateData.dispatchDate = details.dispatchDate;
    }

    await client.update(orders).set(updateData).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));

    await client.execute(sql`
      INSERT INTO audit_logs (id, table_name, record_id, action, old_data, new_data, staff_id, created_at)
      VALUES (
        gen_random_uuid(),
        'orders',
        ${id},
        'DISPATCH_STATUS_UPDATE',
        ${JSON.stringify({ status: currentStatus })},
        ${JSON.stringify({ status: newStatus, ...details })},
        ${staffId},
        now()
      )
    `);

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

  async resolveException(tx: any, tenantId: string, id: string): Promise<Order> {
    const client = tx || db;
    await client.update(orders).set({
      exceptionStatus: 'RESOLVED',
      updatedAt: new Date()
    }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));

    return this.getOrderById(tenantId, id) as any;
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
