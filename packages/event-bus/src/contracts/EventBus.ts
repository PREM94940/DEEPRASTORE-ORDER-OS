export interface DomainEvent<T = any> {
  id: string;
  name: string;
  timestamp: string;
  actorId: string;
  correlationId: string;
  data: T;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void;
}
