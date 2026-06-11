export interface InventoryLocation {
  id: string;
  tenantId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLevel {
  id: string;
  tenantId: string;
  inventoryLocationId: string;
  productVariantId: string;
  available: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryReservation {
  id: string;
  tenantId: string;
  inventoryLocationId: string;
  productVariantId: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  referenceId: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
