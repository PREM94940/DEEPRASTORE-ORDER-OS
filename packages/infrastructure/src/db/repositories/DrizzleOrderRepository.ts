import { eq, and } from 'drizzle-orm';
import { orders, orderLineItems, orderAddresses } from '../../schema/order';
import { 
  IOrderRepository, 
  CreateOrderDTO, 
  CreateOrderLineItemDTO, 
  CreateOrderAddressDTO 
} from '../../../../core-domain/src/order/repositories/IOrderRepository';
import { Order, OrderLineItem, OrderAddress } from '../../../../core-domain/src/order/domain/models/OrderModels';

export class DrizzleOrderRepository implements IOrderRepository {
  constructor(private readonly db: any) {}

  async createOrder(tx: any, data: CreateOrderDTO): Promise<Order> {
    const db = tx || this.db;
    const [result] = await db.insert(orders).values({
      tenantId: data.tenantId,
      customerId: data.customerId,
      status: data.status,
      totalAmount: data.totalAmount?.toString(),
    }).returning();
    
    return {
      ...result,
      totalAmount: result.totalAmount ? Number(result.totalAmount) : null,
    } as Order;
  }

  async getOrderById(tenantId: string, id: string): Promise<Order | null> {
    const [result] = await this.db.select().from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, id)));
    if (!result) return null;
    
    return {
      ...result,
      totalAmount: result.totalAmount ? Number(result.totalAmount) : null,
    } as Order;
  }

  async updateOrderStatus(tx: any, tenantId: string, id: string, status: string): Promise<Order> {
    const db = tx || this.db;
    const [result] = await db.update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, id)))
      .returning();
      
    if (!result) throw new Error('Order not found');
    
    return {
      ...result,
      totalAmount: result.totalAmount ? Number(result.totalAmount) : null,
    } as Order;
  }

  async updateOrderDetails(tx: any, tenantId: string, id: string, data: Partial<CreateOrderDTO>): Promise<Order> {
    const client = tx || this.db;
    
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

    const [result] = await client.update(orders).set(updateData).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId))).returning();
    
    if (!result) throw new Error('Order not found');
    return {
      ...result,
      totalAmount: result.totalAmount ? Number(result.totalAmount) : null,
    } as Order;
  }

  async addLineItem(tx: any, data: CreateOrderLineItemDTO): Promise<OrderLineItem> {
    const db = tx || this.db;
    const [result] = await db.insert(orderLineItems).values({
      tenantId: data.tenantId,
      orderId: data.orderId,
      productVariantId: data.productVariantId,
      quantity: data.quantity,
      price: data.price.toString(),
    }).returning();
    
    return {
      ...result,
      price: Number(result.price),
    } as OrderLineItem;
  }

  async getLineItemsByOrderId(tenantId: string, orderId: string): Promise<OrderLineItem[]> {
    const results = await this.db.select().from(orderLineItems)
      .where(and(eq(orderLineItems.tenantId, tenantId), eq(orderLineItems.orderId, orderId)));
      
    return results.map((result: any) => ({
      ...result,
      price: Number(result.price),
    })) as OrderLineItem[];
  }

  async addAddress(tx: any, data: CreateOrderAddressDTO): Promise<OrderAddress> {
    const db = tx || this.db;
    const [result] = await db.insert(orderAddresses).values({
      tenantId: data.tenantId,
      orderId: data.orderId,
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    }).returning();
    
    return result as OrderAddress;
  }

  async getAddressByOrderId(tenantId: string, orderId: string): Promise<OrderAddress | null> {
    const [result] = await this.db.select().from(orderAddresses)
      .where(and(eq(orderAddresses.tenantId, tenantId), eq(orderAddresses.orderId, orderId)));
      
    return result ? (result as OrderAddress) : null;
  }
}
