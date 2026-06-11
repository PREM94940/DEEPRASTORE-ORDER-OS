import { Product, ProductVariant, Collection, CollectionProduct } from '../domain/models/CatalogModels';

export interface CreateProductDTO {
  tenantId: string;
  title: string;
  description?: string | null;
  status?: string;
}

export interface UpdateProductDTO {
  title?: string;
  description?: string | null;
  status?: string;
}

export interface CreateVariantDTO {
  tenantId: string;
  productId: string;
  title: string;
  sku?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
}

export interface CreateCollectionDTO {
  tenantId: string;
  title: string;
  description?: string | null;
}

export interface ICatalogRepository {
  // Products
  createProduct(tx: any, data: CreateProductDTO): Promise<Product>;
  getProductById(tenantId: string, id: string): Promise<Product | null>;
  updateProduct(tx: any, tenantId: string, id: string, data: UpdateProductDTO): Promise<Product>;
  deleteProduct(tx: any, tenantId: string, id: string): Promise<void>;
  
  // Variants
  createVariant(tx: any, data: CreateVariantDTO): Promise<ProductVariant>;
  getVariantsByProductId(tenantId: string, productId: string): Promise<ProductVariant[]>;
  getVariantById(tenantId: string, id: string): Promise<ProductVariant | null>;
  
  // Collections
  createCollection(tx: any, data: CreateCollectionDTO): Promise<Collection>;
  getCollectionById(tenantId: string, id: string): Promise<Collection | null>;
  
  // Relationships
  addProductToCollection(tx: any, tenantId: string, collectionId: string, productId: string, position?: number): Promise<CollectionProduct>;
  removeProductFromCollection(tx: any, tenantId: string, collectionId: string, productId: string): Promise<void>;
  getProductsInCollection(tenantId: string, collectionId: string): Promise<Product[]>;
}
