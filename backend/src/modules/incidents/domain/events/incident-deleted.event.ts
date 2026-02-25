import { DomainEvent } from '../../../../shared/domain/events/domain-event.base';
import { IncidentProps } from '../entities/incident.entity';

export class IncidentDeletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'incident.deleted';

  constructor(
    public readonly incident: IncidentProps,
    public readonly actorId: string,
  ) {
    super();
  }

  get eventName(): string {
    return IncidentDeletedEvent.EVENT_NAME;
  }
}
