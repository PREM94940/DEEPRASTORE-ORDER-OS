import { DomainEvent } from '../../../event-bus/src/contracts/EventBus';

export interface OutboxRepository {
  save(event: DomainEvent, dbTransaction?: any): Promise<void>;
}
