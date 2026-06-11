import { ICatalogRepository, CreateProductDTO, CreateVariantDTO, UpdateProductDTO } from '../repositories/ICatalogRepository';
import { Product, ProductVariant } from '../domain/models/CatalogModels';

export class ProductService {
  constructor(
    private readonly db: any,
    private readonly catalogRepository: ICatalogRepository
  ) {}

  async createProductWithVariants(tenantId: string, productData: Omit<CreateProductDTO, 'tenantId'>, variants: Omit<CreateVariantDTO, 'tenantId' | 'productId'>[]): Promise<{ product: Product, variants: ProductVariant[] }> {
    return await this.db.transaction(async (tx: any) => {
      // 1. Create Product
      const product = await this.catalogRepository.createProduct(tx, {
        tenantId,
        ...productData
      });

      // 2. Create Variants
      const createdVariants: ProductVariant[] = [];
      for (const variantData of variants) {
        const variant = await this.catalogRepository.createVariant(tx, {
          tenantId,
          productId: product.id,
          ...variantData
        });
        createdVariants.push(variant);
      }

      return { product, variants: createdVariants };
    });
  }

  async updateProduct(tenantId: string, productId: string, data: UpdateProductDTO): Promise<Product> {
    return await this.db.transaction(async (tx: any) => {
      const existingProduct = await this.catalogRepository.getProductById(tenantId, productId);
      if (!existingProduct) {
        throw new Error(`Product with ID ${productId} not found.`);
      }

      return await this.catalogRepository.updateProduct(tx, tenantId, productId, data);
    });
  }

  async getProduct(tenantId: string, productId: string): Promise<Product | null> {
    return await this.catalogRepository.getProductById(tenantId, productId);
  }

  async getProductVariants(tenantId: string, productId: string): Promise<ProductVariant[]> {
    return await this.catalogRepository.getVariantsByProductId(tenantId, productId);
  }
}
