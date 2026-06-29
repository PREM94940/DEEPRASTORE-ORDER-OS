export interface Order {
  id: string;
  tenantId: string;
  customerId: string | null;
  status: string;
  totalAmount: number | null;
  balanceAmount: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderLineItem {
  id: string;
  tenantId: string;
  orderId: string;
  productVariantId: string | null;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface OrderAddress {
  id: string;
  tenantId: string;
  orderId: string;
  fullName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: Date;
}
