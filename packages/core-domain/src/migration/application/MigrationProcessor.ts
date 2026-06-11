import { EventBus } from '../../../../event-bus/src/contracts/EventBus';
import { MigrationEvent } from '../../../../event-bus/src/schemas/migration';
import { ConfirmOrderUseCase } from '../../order/application/ConfirmOrderUseCase';

export class MigrationProcessor {
  constructor(
    private eventBus: EventBus,
    private confirmOrderUseCase: ConfirmOrderUseCase
  ) {}

  async processLegacyOrder(event: MigrationEvent<{ legacyOrderId: string, customerId: string }>) {
    if (!event.name.startsWith('system.migration.')) {
      throw new Error("Processor strictly accepts system.migration events");
    }

    // Bypass payment gateways but strictly enforce domain rules
    await this.confirmOrderUseCase.execute(event.data.customerId);
  }
}
