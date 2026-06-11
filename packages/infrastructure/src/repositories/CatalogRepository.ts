import { ICatalogRepository } from '../../../core-domain/src/catalog/repositories/ICatalogRepository';

export class CatalogRepository implements Partial<ICatalogRepository> {
  async getVariantById(tenantId: string, id: string) {
    // Wave 1: No inventory logic or catalog DB
    return {
      id,
      tenantId,
      price: 8500
    } as any;
  }
}
