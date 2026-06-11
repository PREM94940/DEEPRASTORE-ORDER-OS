import { ICatalogRepository, CreateCollectionDTO } from '../repositories/ICatalogRepository';
import { Collection, Product } from '../domain/models/CatalogModels';

export class CollectionService {
  constructor(
    private readonly db: any,
    private readonly catalogRepository: ICatalogRepository
  ) {}

  async createCollection(tenantId: string, data: Omit<CreateCollectionDTO, 'tenantId'>): Promise<Collection> {
    return await this.db.transaction(async (tx: any) => {
      return await this.catalogRepository.createCollection(tx, {
        tenantId,
        ...data
      });
    });
  }

  async addProductToCollection(tenantId: string, collectionId: string, productId: string, position?: number): Promise<void> {
    return await this.db.transaction(async (tx: any) => {
      const collection = await this.catalogRepository.getCollectionById(tenantId, collectionId);
      if (!collection) {
        throw new Error(`Collection with ID ${collectionId} not found.`);
      }

      const product = await this.catalogRepository.getProductById(tenantId, productId);
      if (!product) {
        throw new Error(`Product with ID ${productId} not found.`);
      }

      await this.catalogRepository.addProductToCollection(tx, tenantId, collectionId, productId, position);
    });
  }

  async removeProductFromCollection(tenantId: string, collectionId: string, productId: string): Promise<void> {
    return await this.db.transaction(async (tx: any) => {
      await this.catalogRepository.removeProductFromCollection(tx, tenantId, collectionId, productId);
    });
  }

  async getCollectionProducts(tenantId: string, collectionId: string): Promise<Product[]> {
    return await this.catalogRepository.getProductsInCollection(tenantId, collectionId);
  }
}
