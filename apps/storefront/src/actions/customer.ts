import { CustomerService } from '../../../../packages/infrastructure/src/services/CustomerService';
import { DrizzleCustomerRepository } from '../../../../packages/infrastructure/src/db/repositories/DrizzleCustomerRepository';
import { db } from '../../../../packages/infrastructure/src/db/client';
import { requireAuth } from '../lib/auth';

function getCustomerService() {
  const repo = new DrizzleCustomerRepository(db);
  return new CustomerService(repo);
}

export async function createCustomer(phone: string, leadId?: string) {
  const { tenantId } = await requireAuth();
  const service = getCustomerService();
  return service.createCustomer(tenantId, phone, leadId);
}

export async function getCustomer(customerId: string) {
  const { tenantId } = await requireAuth();
  const service = getCustomerService();
  return service.getCustomerById(tenantId, customerId);
}

export async function addCustomerAddress(address: {
  customerId: string;
  fullName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}) {
  const { tenantId } = await requireAuth();
  const service = getCustomerService();
  return service.addCustomerAddress({ tenantId, ...address });
}

export async function getCustomerAddresses(customerId: string) {
  const { tenantId } = await requireAuth();
  const service = getCustomerService();
  return service.getCustomerAddresses(tenantId, customerId);
}
