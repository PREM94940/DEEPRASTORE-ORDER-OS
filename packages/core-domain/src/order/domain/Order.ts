export interface LineItem {
  productVariantId: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  fullName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly customerId: string | null,
    public readonly items: LineItem[],
    public readonly shippingAddress: ShippingAddress,
    public status: 'PENDING' | 'CONFIRMED' | 'CANCELLED',
    public readonly totalAmount: number
  ) {}

  static create(
    tenantId: string,
    customerId: string | null,
    items: LineItem[],
    shippingAddress: ShippingAddress
  ): Order {
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return new Order(crypto.randomUUID(), tenantId, customerId, items, shippingAddress, 'PENDING', totalAmount);
  }

  confirm() {
    this.status = 'CONFIRMED';
  }
}
