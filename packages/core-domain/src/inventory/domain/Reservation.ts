export type ReservationState = 'AVAILABLE' | 'RESERVED' | 'ALLOCATED' | 'FULFILLED' | 'EXPIRED';

export class Reservation {
  public state: ReservationState;
  
  constructor(
    public readonly id: string,
    public readonly sku: string,
    public readonly expiresAt: Date,
    initialState: ReservationState = 'RESERVED'
  ) {
    this.state = initialState;
  }

  allocate() {
    if (this.state !== 'RESERVED') throw new Error('Can only allocate a RESERVED item');
    this.state = 'ALLOCATED';
  }

  fulfill() {
    if (this.state !== 'ALLOCATED') throw new Error('Can only fulfill an ALLOCATED item');
    this.state = 'FULFILLED';
  }

  expire() {
    if (this.state !== 'RESERVED') throw new Error('Only RESERVED items can expire');
    this.state = 'EXPIRED';
  }

  release() {
    if (this.state !== 'EXPIRED') throw new Error('Must be expired to return to AVAILABLE');
    this.state = 'AVAILABLE';
  }
}
