export interface Product {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  tenantId: string;
  productId: string;
  title: string;
  sku: string | null;
  price: number | null;
  compareAtPrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionProduct {
  id: string;
  tenantId: string;
  collectionId: string;
  productId: string;
  position: number | null;
  createdAt: Date;
}
