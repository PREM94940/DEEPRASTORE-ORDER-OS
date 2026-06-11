export class Inventory {
  constructor(
    public readonly sku: string,
    public quantity: number
  ) {}

  reserve(amount: number) {
    if (this.quantity < amount) throw new Error("Insufficient stock");
    this.quantity -= amount;
  }
}
