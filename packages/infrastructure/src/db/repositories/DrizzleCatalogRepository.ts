import { eq, and } from 'drizzle-orm';
import { products, productVariants, collections, collectionProducts } from '../../schema/catalog';
import { 
  ICatalogRepository, 
  CreateProductDTO, 
  UpdateProductDTO, 
  CreateVariantDTO, 
  CreateCollectionDTO 
} from '../../../../core-domain/src/catalog/repositories/ICatalogRepository';
import { Product, ProductVariant, Collection, CollectionProduct } from '../../../../core-domain/src/catalog/domain/models/CatalogModels';

export class DrizzleCatalogRepository implements ICatalogRepository {
  constructor(private readonly db: any) {}

  async createProduct(tx: any, data: CreateProductDTO): Promise<Product> {
    const db = tx || this.db;
    const [result] = await db.insert(products).values({
      tenantId: data.tenantId,
      title: data.title,
      description: data.description,
      status: data.status,
    }).returning();
    return result as Product;
  }

  async getProductById(tenantId: string, id: string): Promise<Product | null> {
    const [result] = await this.db.select().from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.id, id)));
    return result ? (result as Product) : null;
  }

  async updateProduct(tx: any, tenantId: string, id: string, data: UpdateProductDTO): Promise<Product> {
    const db = tx || this.db;
    const [result] = await db.update(products)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(products.tenantId, tenantId), eq(products.id, id)))
      .returning();
    if (!result) throw new Error('Product not found');
    return result as Product;
  }

  async deleteProduct(tx: any, tenantId: string, id: string): Promise<void> {
    const db = tx || this.db;
    await db.delete(products).where(and(eq(products.tenantId, tenantId), eq(products.id, id)));
  }

  async createVariant(tx: any, data: CreateVariantDTO): Promise<ProductVariant> {
    const db = tx || this.db;
    const [result] = await db.insert(productVariants).values({
      tenantId: data.tenantId,
      productId: data.productId,
      title: data.title,
      sku: data.sku,
      price: data.price?.toString(),
      compareAtPrice: data.compareAtPrice?.toString(),
    }).returning();
    
    return {
      ...result,
      price: result.price ? Number(result.price) : null,
      compareAtPrice: result.compareAtPrice ? Number(result.compareAtPrice) : null,
    } as ProductVariant;
  }

  async getVariantsByProductId(tenantId: string, productId: string): Promise<ProductVariant[]> {
    const results = await this.db.select().from(productVariants)
      .where(and(eq(productVariants.tenantId, tenantId), eq(productVariants.productId, productId)));
    return results.map((result: any) => ({
      ...result,
      price: result.price ? Number(result.price) : null,
      compareAtPrice: result.compareAtPrice ? Number(result.compareAtPrice) : null,
    })) as ProductVariant[];
  }

  async getVariantById(tenantId: string, id: string): Promise<ProductVariant | null> {
    const [result] = await this.db.select().from(productVariants)
      .where(and(eq(productVariants.tenantId, tenantId), eq(productVariants.id, id)));
    if (!result) return null;
    return {
      ...result,
      price: result.price ? Number(result.price) : null,
      compareAtPrice: result.compareAtPrice ? Number(result.compareAtPrice) : null,
    } as ProductVariant;
  }

  async createCollection(tx: any, data: CreateCollectionDTO): Promise<Collection> {
    const db = tx || this.db;
    const [result] = await db.insert(collections).values({
      tenantId: data.tenantId,
      title: data.title,
      description: data.description,
    }).returning();
    return result as Collection;
  }

  async getCollectionById(tenantId: string, id: string): Promise<Collection | null> {
    const [result] = await this.db.select().from(collections)
      .where(and(eq(collections.tenantId, tenantId), eq(collections.id, id)));
    return result ? (result as Collection) : null;
  }

  async addProductToCollection(tx: any, tenantId: string, collectionId: string, productId: string, position?: number): Promise<CollectionProduct> {
    const db = tx || this.db;
    const [result] = await db.insert(collectionProducts).values({
      tenantId,
      collectionId,
      productId,
      position,
    }).returning();
    return result as CollectionProduct;
  }

  async removeProductFromCollection(tx: any, tenantId: string, collectionId: string, productId: string): Promise<void> {
    const db = tx || this.db;
    await db.delete(collectionProducts)
      .where(
        and(
          eq(collectionProducts.tenantId, tenantId),
          eq(collectionProducts.collectionId, collectionId),
          eq(collectionProducts.productId, productId)
        )
      );
  }

  async getProductsInCollection(tenantId: string, collectionId: string): Promise<Product[]> {
    const results = await this.db.select({
      product: products
    })
    .from(collectionProducts)
    .innerJoin(products, eq(collectionProducts.productId, products.id))
    .where(
      and(
        eq(collectionProducts.tenantId, tenantId),
        eq(collectionProducts.collectionId, collectionId)
      )
    )
    .orderBy(collectionProducts.position);

    return results.map((row: any) => row.product) as Product[];
  }
}
