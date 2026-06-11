import { InventoryLevel, InventoryLocation, InventoryReservation } from '../domain/models/InventoryModels';

export interface CreateReservationDTO {
  tenantId: string;
  inventoryLocationId: string;
  productVariantId: string;
  quantity: number;
  expiresAt: Date;
  referenceId?: string | null;
}

export interface IInventoryRepository {
  // Locations
  getLocationById(tenantId: string, id: string): Promise<InventoryLocation | null>;
  
  // Levels
  getInventoryLevel(tenantId: string, locationId: string, variantId: string): Promise<InventoryLevel | null>;
  adjustInventoryLevel(tx: any, tenantId: string, locationId: string, variantId: string, quantityChange: number): Promise<InventoryLevel>;
  
  // Reservations
  createReservation(tx: any, data: CreateReservationDTO): Promise<InventoryReservation>;
  getReservationById(tenantId: string, id: string): Promise<InventoryReservation | null>;
  updateReservationStatus(tx: any, tenantId: string, id: string, status: 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'): Promise<InventoryReservation>;
}
