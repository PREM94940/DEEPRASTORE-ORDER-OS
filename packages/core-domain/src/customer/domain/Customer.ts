export interface Address {
  id: string;
  fullName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly phone: string,
    public readonly originalLeadId: string | null,
    public readonly addresses: Address[] = []
  ) {}

  static create(tenantId: string, phone: string, leadId: string | null): Customer {
    return new Customer(crypto.randomUUID(), tenantId, phone, leadId);
  }

  addAddress(address: Omit<Address, 'id'>) {
    this.addresses.push({
      id: crypto.randomUUID(),
      ...address
    });
  }
}
