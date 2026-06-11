import { ICustomerRepository } from '../../core-domain/src/customer/repositories/ICustomerRepository';
import { db } from '../db/client';

export class CustomerService {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async getCustomerById(tenantId: string, customerId: string) {
    return this.customerRepo.getCustomerById(tenantId, customerId);
  }

  async createCustomer(tenantId: string, phone: string, leadId?: string) {
    return this.customerRepo.createCustomer(db, {
      tenantId,
      phone,
      leadId: leadId || null,
    });
  }

  async getCustomerAddresses(tenantId: string, customerId: string) {
    // Validate that the customer exists in this tenant
    const customer = await this.getCustomerById(tenantId, customerId);
    if (!customer) throw new Error('Customer not found');

    return this.customerRepo.getAddressesByCustomerId(tenantId, customerId);
  }

  async addCustomerAddress(address: {
    tenantId: string;
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
    // Validate that the customer exists in this tenant
    const customer = await this.getCustomerById(address.tenantId, address.customerId);
    if (!customer) throw new Error('Customer not found');

    return this.customerRepo.addAddress(db, {
      ...address,
      phone: address.phone || null,
      addressLine2: address.addressLine2 || null,
    });
  }
}
