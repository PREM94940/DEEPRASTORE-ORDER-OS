import { eq, and } from 'drizzle-orm';
import { customers, customerAddresses } from '../../schema/customer';
import { 
  ICustomerRepository, 
  CreateCustomerDTO, 
  CreateCustomerAddressDTO 
} from '../../../../core-domain/src/customer/repositories/ICustomerRepository';
import { Customer, CustomerAddress } from '../../../../core-domain/src/customer/domain/models/CustomerModels';

export class DrizzleCustomerRepository implements ICustomerRepository {
  constructor(private readonly db: any) {}

  async createCustomer(tx: any, data: CreateCustomerDTO): Promise<Customer> {
    const db = tx || this.db;
    const [result] = await db.insert(customers).values({
      tenantId: data.tenantId,
      phone: data.phone,
      leadId: data.leadId,
    }).returning();
    return result as Customer;
  }

  async getCustomerById(tenantId: string, id: string): Promise<Customer | null> {
    const [result] = await this.db.select().from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
    return result ? (result as Customer) : null;
  }

  async addAddress(tx: any, data: CreateCustomerAddressDTO): Promise<CustomerAddress> {
    const db = tx || this.db;
    const [result] = await db.insert(customerAddresses).values({
      tenantId: data.tenantId,
      customerId: data.customerId,
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    }).returning();
    return result as CustomerAddress;
  }

  async getAddressesByCustomerId(tenantId: string, customerId: string): Promise<CustomerAddress[]> {
    const results = await this.db.select().from(customerAddresses)
      .where(and(eq(customerAddresses.tenantId, tenantId), eq(customerAddresses.customerId, customerId)));
    return results as CustomerAddress[];
  }
}
