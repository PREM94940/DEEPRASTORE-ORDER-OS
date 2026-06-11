export interface InventoryReadDTO {
  sku: string;
  availableQuantity: number;
}

export class InventoryReadModel {
  async getAvailability(sku: string): Promise<InventoryReadDTO> {
    // Simulated direct raw SQL read
    return { sku, availableQuantity: 5 };
  }
}
