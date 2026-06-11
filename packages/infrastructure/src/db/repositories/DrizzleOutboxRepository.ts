import { DomainEvent } from '../../../../event-bus/src/contracts/EventBus';
import { OutboxRepository } from '../../../../core-domain/src/contracts/OutboxRepository';

export class DrizzleOutboxRepository implements OutboxRepository {
  async save(event: DomainEvent, dbTransaction?: any): Promise<void> {
    // Simulated Drizzle insert: await dbTransaction.insert(outbox_events).values(...)
    return Promise.resolve();
  }
}
