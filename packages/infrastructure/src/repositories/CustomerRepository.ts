import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { customers, customerAddresses } from '../schema/customer';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhone } from '../../../core-domain/src/utils/phone';
import { ICustomerRepository, CreateCustomerDTO, CreateCustomerAddressDTO } from '../../../core-domain/src/customer/repositories/ICustomerRepository';
import { Customer, CustomerAddress } from '../../../core-domain/src/customer/domain/models/CustomerModels';

export class CustomerRepository implements ICustomerRepository {
  async createCustomer(tx: any, data: CreateCustomerDTO): Promise<Customer> {
    const id = uuidv4();
    const client = tx || db;
    const normalizedPhone = normalizePhone(data.phone);
    await client.insert(customers).values({
      id,
      tenantId: data.tenantId,
      phone: normalizedPhone || null,
      leadId: data.leadId || null,
    });
    
    const result = await client.select().from(customers).where(eq(customers.id, id));
    return result[0] as unknown as Customer;
  }

  async getCustomerById(tenantId: string, id: string): Promise<Customer | null> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    if (!result.length || result[0].tenantId !== tenantId) return null;
    return result[0] as unknown as Customer;
  }

  async getCustomerByPhone(tenantId: string, phone: string) {
    const normalizedPhone = normalizePhone(phone);
    const result = await db.select().from(customers).where(
      and(
        eq(customers.tenantId, tenantId),
        eq(customers.phone, normalizedPhone)
      )
    );
    if (!result.length || result[0].tenantId !== tenantId) return null;
    return result[0] as unknown as Customer;
  }

  async addAddress(tx: any, data: CreateCustomerAddressDTO): Promise<CustomerAddress> {
    const id = uuidv4();
    const client = tx || db;
    await client.insert(customerAddresses).values({
      id,
      ...data,
      phone: data.phone || null,
      addressLine2: data.addressLine2 || null,
    });
    const result = await client.select().from(customerAddresses).where(eq(customerAddresses.id, id));
    return result[0] as unknown as CustomerAddress;
  }

  async getAddressesByCustomerId(tenantId: string, customerId: string): Promise<CustomerAddress[]> {
    const result = await db.select().from(customerAddresses).where(eq(customerAddresses.customerId, customerId));
    return result.filter((a: any) => a.tenantId === tenantId) as unknown as CustomerAddress[];
  }
}
