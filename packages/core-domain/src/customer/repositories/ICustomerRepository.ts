import { Customer, CustomerAddress } from '../domain/models/CustomerModels';

export interface CreateCustomerDTO {
  tenantId: string;
  phone?: string | null;
  leadId?: string | null;
}

export interface CreateCustomerAddressDTO {
  tenantId: string;
  customerId: string;
  fullName: string;
  phone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ICustomerRepository {
  createCustomer(tx: any, data: CreateCustomerDTO): Promise<Customer>;
  getCustomerById(tenantId: string, id: string): Promise<Customer | null>;
  
  addAddress(tx: any, data: CreateCustomerAddressDTO): Promise<CustomerAddress>;
  getAddressesByCustomerId(tenantId: string, customerId: string): Promise<CustomerAddress[]>;
}
