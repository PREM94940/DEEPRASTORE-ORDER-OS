export interface Customer {
  id: string;
  tenantId: string;
  leadId: string | null;
  phone: string | null;
  createdAt: Date;
}

export interface CustomerAddress {
  id: string;
  tenantId: string;
  customerId: string;
  fullName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}
