import { EventBus, DomainEvent } from '../contracts/EventBus';

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Array<(e: DomainEvent) => Promise<void>>> = new Map();
  public publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
    const eventHandlers = this.handlers.get(event.name) || [];
    
    // Simulate async decoupling
    for (const handler of eventHandlers) {
      await handler(event);
    }
  }

  subscribe(eventName: string, handler: (e: DomainEvent) => Promise<void>): void {
    const existing = this.handlers.get(eventName) || [];
    this.handlers.set(eventName, [...existing, handler]);
  }
}
