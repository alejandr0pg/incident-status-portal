import { DomainEvent } from '../../../../shared/domain/events/domain-event.base';
import { IncidentProps } from '../entities/incident.entity';

export class IncidentUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'incident.updated';

  constructor(
    public readonly before: IncidentProps,
    public readonly after: IncidentProps,
    public readonly actorId: string,
  ) {
    super();
  }

  get eventName(): string {
    return IncidentUpdatedEvent.EVENT_NAME;
  }
}
