import { DomainEvent } from '../../../../shared/domain/events/domain-event.base';
import { IncidentProps } from '../entities/incident.entity';

export class IncidentCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'incident.created';

  constructor(
    public readonly incident: IncidentProps,
    public readonly actorId: string,
  ) {
    super();
  }

  get eventName(): string {
    return IncidentCreatedEvent.EVENT_NAME;
  }
}
