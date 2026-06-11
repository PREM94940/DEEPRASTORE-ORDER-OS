import { Order, OrderLineItem, OrderAddress } from '../domain/models/OrderModels';

export interface CreateOrderDTO {
  tenantId: string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  source?: string;
  orderType?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  totalAmount?: number | null;
  expectedDeliveryDate?: Date | null;
}

export interface CreateOrderLineItemDTO {
  tenantId: string;
  orderId: string;
  productVariantId?: string | null;
  quantity: number;
  price: number;
}

export interface CreateOrderAddressDTO {
  tenantId: string;
  orderId: string;
  fullName: string;
  phone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrderRepository {
  createOrder(tx: any, data: CreateOrderDTO): Promise<Order>;
  getOrderById(tenantId: string, id: string): Promise<Order | null>;
  updateOrderStatus(tx: any, tenantId: string, id: string, status: string): Promise<Order>;
  
  addLineItem(tx: any, data: CreateOrderLineItemDTO): Promise<OrderLineItem>;
  getLineItemsByOrderId(tenantId: string, orderId: string): Promise<OrderLineItem[]>;
  
  addAddress(tx: any, data: CreateOrderAddressDTO): Promise<OrderAddress>;
  getAddressByOrderId(tenantId: string, orderId: string): Promise<OrderAddress | null>;
}
