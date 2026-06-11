import { eq, and } from 'drizzle-orm';
import { inventoryLocations, inventoryLevels, inventoryReservations } from '../../schema/inventory';
import { 
  IInventoryRepository, 
  CreateReservationDTO 
} from '../../../../core-domain/src/inventory/repositories/IInventoryRepository';
import { InventoryLevel, InventoryLocation, InventoryReservation } from '../../../../core-domain/src/inventory/domain/models/InventoryModels';

export class DrizzleInventoryRepository implements IInventoryRepository {
  constructor(private readonly db: any) {}

  async getLocationById(tenantId: string, id: string): Promise<InventoryLocation | null> {
    const [result] = await this.db.select().from(inventoryLocations)
      .where(and(eq(inventoryLocations.tenantId, tenantId), eq(inventoryLocations.id, id)));
    return result ? (result as InventoryLocation) : null;
  }

  async getInventoryLevel(tenantId: string, locationId: string, variantId: string): Promise<InventoryLevel | null> {
    const [result] = await this.db.select().from(inventoryLevels)
      .where(
        and(
          eq(inventoryLevels.tenantId, tenantId),
          eq(inventoryLevels.inventoryLocationId, locationId),
          eq(inventoryLevels.productVariantId, variantId)
        )
      );
    return result ? (result as InventoryLevel) : null;
  }

  async adjustInventoryLevel(tx: any, tenantId: string, locationId: string, variantId: string, quantityChange: number): Promise<InventoryLevel> {
    const db = tx || this.db;
    const current = await this.getInventoryLevel(tenantId, locationId, variantId);
    
    if (current) {
      const [result] = await db.update(inventoryLevels)
        .set({
          available: current.available + quantityChange,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(inventoryLevels.tenantId, tenantId),
            eq(inventoryLevels.inventoryLocationId, locationId),
            eq(inventoryLevels.productVariantId, variantId)
          )
        )
        .returning();
      return result as InventoryLevel;
    } else {
      const [result] = await db.insert(inventoryLevels).values({
        tenantId,
        inventoryLocationId: locationId,
        productVariantId: variantId,
        available: quantityChange
      }).returning();
      return result as InventoryLevel;
    }
  }

  async createReservation(tx: any, data: CreateReservationDTO): Promise<InventoryReservation> {
    const db = tx || this.db;
    const [result] = await db.insert(inventoryReservations).values({
      tenantId: data.tenantId,
      inventoryLocationId: data.inventoryLocationId,
      productVariantId: data.productVariantId,
      quantity: data.quantity,
      status: 'PENDING',
      expiresAt: data.expiresAt,
      referenceId: data.referenceId || null,
    }).returning();
    return result as InventoryReservation;
  }

  async getReservationById(tenantId: string, id: string): Promise<InventoryReservation | null> {
    const [result] = await this.db.select().from(inventoryReservations)
      .where(and(eq(inventoryReservations.tenantId, tenantId), eq(inventoryReservations.id, id)));
    return result ? (result as InventoryReservation) : null;
  }

  async updateReservationStatus(tx: any, tenantId: string, id: string, status: 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'): Promise<InventoryReservation> {
    const db = tx || this.db;
    const [result] = await db.update(inventoryReservations)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(and(eq(inventoryReservations.tenantId, tenantId), eq(inventoryReservations.id, id)))
      .returning();
    if (!result) throw new Error('Reservation not found');
    return result as InventoryReservation;
  }
}
