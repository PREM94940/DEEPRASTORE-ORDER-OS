import { Reservation } from '../domain/Reservation';

export class ReservationEngine {
  async createReservation(sku: string, lockDurationMinutes: number): Promise<Reservation> {
    // Concurrency protection occurs via Postgres SELECT FOR UPDATE in Infrastructure Repo
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + lockDurationMinutes);
    
    return new Reservation(crypto.randomUUID(), sku, expiresAt);
  }

  async processExpiration(reservation: Reservation): Promise<void> {
    if (new Date() >= reservation.expiresAt) {
      reservation.expire();
      reservation.release();
    }
  }
}
