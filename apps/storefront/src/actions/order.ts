import { OrderService } from '../../../../packages/infrastructure/src/services/OrderService';
import { DrizzleOrderRepository } from '../../../../packages/infrastructure/src/db/repositories/DrizzleOrderRepository';
import { DrizzleCatalogRepository } from '../../../../packages/infrastructure/src/db/repositories/DrizzleCatalogRepository';
import { db } from '../../../../packages/infrastructure/src/db/client';
import { requireAuth } from '../lib/auth';

function getOrderService() {
  const orderRepo = new DrizzleOrderRepository(db);
  const catalogRepo = new DrizzleCatalogRepository(db);
  return new OrderService(orderRepo, catalogRepo);
}

export async function createOrder(params: {
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
  const { tenantId } = await requireAuth();
  const service = getOrderService();
  return service.createOrder({ tenantId, ...params });
}

export async function getOrder(orderId: string) {
  const { tenantId } = await requireAuth();
  const service = getOrderService();
  return service.getOrder(tenantId, orderId);
}

