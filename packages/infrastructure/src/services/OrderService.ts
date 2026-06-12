import { IOrderRepository } from '../../../core-domain/src/order/repositories/IOrderRepository';
import { Order, CreateOrderDTO, UpdateOrderStatusDTO, AssignStaffDTO } from '../../../core-domain/src/order/domain/models/OrderModels';
import { v4 as uuidv4 } from 'uuid';
import { OrderRepository } from '../repositories/OrderRepository';
import { CatalogRepository } from '../repositories/CatalogRepository';
import { InventoryRepository } from '../repositories/InventoryRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { normalizePhone } from '../../../core-domain/src/utils/phone';
import { db } from '../db/client';

export class OrderService {
  private repository: IOrderRepository;
  private catalogRepo: CatalogRepository;
  private inventoryRepo: InventoryRepository;
  private customerRepo: CustomerRepository;

  constructor(repository?: IOrderRepository) {
    this.repository = repository || new OrderRepository();
    this.catalogRepo = new CatalogRepository();
    this.inventoryRepo = new InventoryRepository();
    this.customerRepo = new CustomerRepository();
  }

  async getOrder(tenantId: string, orderId: string) {
    return this.repository.getOrderById(tenantId, orderId);
  }

  async submitUTR(tenantId: string, orderId: string, utrNumber: string) {
    if (!utrNumber) throw new Error('UTR Number is required');
    return (this.repository as any).updatePaymentUTR(db, tenantId, orderId, utrNumber);
  }

  async verifyPayment(tenantId: string, orderId: string, staffName: string) {
    return (this.repository as any).verifyPayment(db, tenantId, orderId, staffName);
  }

  async rejectPayment(tenantId: string, orderId: string) {
    return (this.repository as any).rejectPayment(db, tenantId, orderId);
  }

  async getPaymentsForVerification(tenantId: string) {
    return (this.repository as any).getPaymentsForVerification(tenantId);
  }

  async getProductionQueue(tenantId: string) {
    return (this.repository as any).getProductionQueue(tenantId);
  }

  async updateOrderProductionStatus(tenantId: string, orderId: string, newStatus: string) {
    return (this.repository as any).updateOrderProductionStatus(db, tenantId, orderId, newStatus);
  }

  async getOrdersByPhone(tenantId: string, phone: string) {
    return (this.repository as any).getOrdersByPhone(tenantId, phone);
  }

  async getAllOrders(tenantId: string) {
    return (this.repository as any).getAllOrders(tenantId);
  }

  async createSupportTicket(tenantId: string, orderId: string, issueType: string, description: string, evidenceUrl: string) {
    return (this.repository as any).createSupportTicket(db, tenantId, orderId, issueType, description, evidenceUrl);
  }

  async getOpenExceptions(tenantId: string) {
    return (this.repository as any).getOpenExceptions(tenantId);
  }

  async createOrder(params: {
    tenantId: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    source?: string;
    orderType?: string;
    paymentMethod?: string;
    items: Array<{ productVariantId: string; quantity: number }>;
    shippingAddress: {
      fullName: string;
      phone?: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  }) {
    let totalAmount = 0;
    
    // Default location for simplicity as multi-location logic isn't provided
    const DEFAULT_LOCATION_ID = 'default-loc';

    for (const item of params.items) {
      const variant = await this.catalogRepo.getVariantById(params.tenantId, item.productVariantId);
      if (!variant) {
        throw new Error(`Product variant ${item.productVariantId} does not exist.`);
      }

      // NO INVENTORY CHECK: Stripping inventory optimization as per DEEPRASTORE-OS-WAVE1-ORDER-PORTAL-001

      totalAmount += (parseFloat(variant.price as string || '0') * item.quantity);
    }

    // Calculate Expected Delivery Date
    const expectedDeliveryDate = new Date();
    if ((params.orderType || 'READY') === 'READY') {
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 3);
    } else {
      // Configurable custom timeline, defaulting to 14 days
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 14);
    }

    let resolvedCustomerId = params.customerId;
    const rawPhone = params.customerPhone || params.shippingAddress.phone;
    const phone = normalizePhone(rawPhone);
    
    if (!resolvedCustomerId && phone) {
      let customer = await this.customerRepo.getCustomerByPhone(params.tenantId, phone);
      if (!customer) {
        customer = await this.customerRepo.createCustomer(db, {
          tenantId: params.tenantId,
          phone: phone
        });
      }
      resolvedCustomerId = customer.id;
    }

    const order = await this.repository.createOrder(db, {
      tenantId: params.tenantId,
      customerId: resolvedCustomerId,
      customerName: params.customerName || params.shippingAddress.fullName,
      customerPhone: phone,
      source: params.source || 'WHATSAPP',
      orderType: params.orderType || 'READY',
      paymentMethod: params.paymentMethod,
      paymentStatus: 'PENDING',
      status: 'DRAFT',
      expectedDeliveryDate,
      totalAmount,
    });

    for (const item of params.items) {
      const variant = await this.catalogRepo.getVariantById(params.tenantId, item.productVariantId);
      if (variant) {
        await this.repository.addLineItem(db, {
          tenantId: params.tenantId,
          orderId: order.id,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          price: parseFloat(variant.price as string || '0'),
        });
      }
    }

    await this.repository.addAddress(db, {
      tenantId: params.tenantId,
      orderId: order.id,
      ...params.shippingAddress,
    });

    return this.getOrder(params.tenantId, order.id);
  }
}
