import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { customers, customerAddresses, measurementsHistory } from '../schema/customer';
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
    
    const [cust] = await client.select().from(customers).where(eq(customers.id, data.customerId));
    if (!cust) throw new Error('Customer not found');

    const insertData = { ...data } as any;
    delete insertData.customerId;

    await client.insert(customerAddresses).values({
      id,
      ...insertData,
      customerPhone: cust.phone,
      phone: data.phone || null,
      addressLine2: data.addressLine2 || null,
    });
    const result = await client.select().from(customerAddresses).where(eq(customerAddresses.id, id));
    return { ...result[0], customerId: data.customerId } as unknown as CustomerAddress;
  }

  async getAddressesByCustomerId(tenantId: string, customerId: string): Promise<CustomerAddress[]> {
    const [cust] = await db.select().from(customers).where(eq(customers.id, customerId));
    if (!cust) return [];

    const result = await db.select().from(customerAddresses).where(eq(customerAddresses.customerPhone, cust.phone));
    return result.filter((a: any) => a.tenantId === tenantId).map((a: any) => ({ ...a, customerId })) as unknown as CustomerAddress[];
  }

  async getMeasurementsByPhone(tenantId: string, phone: string) {
    const normalizedPhone = normalizePhone(phone);
    // tenantId filtering if applicable, though measurementsHistory doesn't have tenantId currently
    // we assume phone is unique across tenants or tenantId should be added to schema later
    const result = await db.select().from(measurementsHistory).where(
      eq(measurementsHistory.customerPhone, normalizedPhone)
    );
    return result;
  }
}
