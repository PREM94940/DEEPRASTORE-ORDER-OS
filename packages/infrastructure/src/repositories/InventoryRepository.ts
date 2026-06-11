import { IInventoryRepository } from '../../../core-domain/src/inventory/repositories/IInventoryRepository';

export class InventoryRepository implements Partial<IInventoryRepository> {
  async getInventoryLevel(tenantId: string, locationId: string, variantId: string) {
    // Wave 1: No inventory logic
    return {
      availableQuantity: 100,
      tenantId
    } as any;
  }
}
