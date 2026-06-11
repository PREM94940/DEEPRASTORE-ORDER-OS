import { IInventoryRepository, CreateReservationDTO } from '../repositories/IInventoryRepository';
import { InventoryReservation } from '../domain/models/InventoryModels';

export class InventoryReservationService {
  constructor(
    private readonly db: any,
    private readonly inventoryRepository: IInventoryRepository
  ) {}

  /**
   * Reserves a specified quantity of a product variant for a limited time.
   * Decrements the available inventory level.
   */
  async reserveInventory(tenantId: string, locationId: string, variantId: string, quantity: number, ttlMinutes: number = 15, referenceId?: string): Promise<InventoryReservation> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0.');
    }

    return await this.db.transaction(async (tx: any) => {
      // 1. Check current level (lock for update would be ideal here if supported by repo, e.g., SELECT ... FOR UPDATE)
      const level = await this.inventoryRepository.getInventoryLevel(tenantId, locationId, variantId);
      if (!level || level.available < quantity) {
        throw new Error('Insufficient inventory available for reservation.');
      }

      // 2. Decrement available inventory
      await this.inventoryRepository.adjustInventoryLevel(tx, tenantId, locationId, variantId, -quantity);

      // 3. Create Reservation record
      const expiresAt = new Date(Date.now() + ttlMinutes * 60000);
      const reservation = await this.inventoryRepository.createReservation(tx, {
        tenantId,
        inventoryLocationId: locationId,
        productVariantId: variantId,
        quantity,
        expiresAt,
        referenceId
      });

      return reservation;
    });
  }

  /**
   * Confirms a reservation, typically called when checkout is successful.
   * The inventory is already decremented, so we just update the reservation status.
   */
  async confirmReservation(tenantId: string, reservationId: string): Promise<InventoryReservation> {
    return await this.db.transaction(async (tx: any) => {
      const reservation = await this.inventoryRepository.getReservationById(tenantId, reservationId);
      if (!reservation) {
        throw new Error('Reservation not found.');
      }

      if (reservation.status !== 'PENDING') {
        throw new Error(`Cannot confirm reservation. Current status is ${reservation.status}.`);
      }

      return await this.inventoryRepository.updateReservationStatus(tx, tenantId, reservationId, 'CONFIRMED');
    });
  }

  /**
   * Cancels a reservation and restores the available inventory.
   */
  async cancelReservation(tenantId: string, reservationId: string): Promise<InventoryReservation> {
    return await this.db.transaction(async (tx: any) => {
      const reservation = await this.inventoryRepository.getReservationById(tenantId, reservationId);
      if (!reservation) {
        throw new Error('Reservation not found.');
      }

      if (reservation.status !== 'PENDING') {
        throw new Error(`Cannot cancel reservation. Current status is ${reservation.status}.`);
      }

      // 1. Update status
      const updatedReservation = await this.inventoryRepository.updateReservationStatus(tx, tenantId, reservationId, 'CANCELLED');

      // 2. Restore available inventory
      await this.inventoryRepository.adjustInventoryLevel(
        tx,
        tenantId,
        reservation.inventoryLocationId,
        reservation.productVariantId,
        reservation.quantity
      );

      return updatedReservation;
    });
  }

  /**
   * Releases an expired reservation and restores available inventory.
   */
  async expireReservation(tenantId: string, reservationId: string): Promise<InventoryReservation> {
    return await this.db.transaction(async (tx: any) => {
      const reservation = await this.inventoryRepository.getReservationById(tenantId, reservationId);
      if (!reservation) {
        throw new Error('Reservation not found.');
      }

      if (reservation.status !== 'PENDING') {
        throw new Error(`Cannot expire reservation. Current status is ${reservation.status}.`);
      }

      if (new Date() <= reservation.expiresAt) {
        throw new Error('Reservation has not yet expired.');
      }

      // 1. Update status
      const updatedReservation = await this.inventoryRepository.updateReservationStatus(tx, tenantId, reservationId, 'EXPIRED');

      // 2. Restore available inventory
      await this.inventoryRepository.adjustInventoryLevel(
        tx,
        tenantId,
        reservation.inventoryLocationId,
        reservation.productVariantId,
        reservation.quantity
      );

      return updatedReservation;
    });
  }
}
