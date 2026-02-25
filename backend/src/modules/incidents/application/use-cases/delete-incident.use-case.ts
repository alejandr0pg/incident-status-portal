import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  IIncidentRepository,
  INCIDENT_REPOSITORY,
} from '../../domain/repositories/incident.repository.interface';
import { IncidentDeletedEvent } from '../../domain/events/incident-deleted.event';
import { UserRole } from '../../../auth/domain/entities/user.entity';

export interface DeleteIncidentInput {
  id: string;
  actorId: string;
  actorRole: UserRole;
}

@Injectable()
export class DeleteIncidentUseCase {
  constructor(
    @Inject(INCIDENT_REPOSITORY)
    private readonly incidentRepository: IIncidentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: DeleteIncidentInput): Promise<void> {
    if (input.actorRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete incidents');
    }

    const existing = await this.incidentRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundException(`Incident with id ${input.id} not found`);
    }

    const snapshot = existing.toSnapshot();

    await this.incidentRepository.delete(input.id);

    this.eventEmitter.emit(
      IncidentDeletedEvent.EVENT_NAME,
      new IncidentDeletedEvent(snapshot, input.actorId),
    );
  }
}
