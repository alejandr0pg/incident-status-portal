import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { z } from 'zod';
import {
  IIncidentRepository,
  INCIDENT_REPOSITORY,
} from '../../domain/repositories/incident.repository.interface';
import { IncidentEntity, Severity, IncidentStatus } from '../../domain/entities/incident.entity';
import { IncidentUpdatedEvent } from '../../domain/events/incident-updated.event';
import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

const UpdateIncidentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  severity: z.nativeEnum(Severity).optional(),
  status: z.nativeEnum(IncidentStatus).optional(),
  impactedServices: z.array(z.string()).optional(),
});

export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema> & {
  id: string;
  actorId: string;
};

@Injectable()
export class UpdateIncidentUseCase {
  constructor(
    @Inject(INCIDENT_REPOSITORY)
    private readonly incidentRepository: IIncidentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: UpdateIncidentInput): Promise<IncidentEntity> {
    const parsed = UpdateIncidentSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }

    const existing = await this.incidentRepository.findById(input.id);
    if (!existing) {
      throw new NotFoundException(`Incident with id ${input.id} not found`);
    }

    const before = existing.toSnapshot();

    // Business rules validated by the aggregate root
    let validatedChanges: typeof parsed.data;
    try {
      validatedChanges = existing.validateUpdate(parsed.data);
    } catch (err) {
      if (err instanceof DomainException) throw new BadRequestException(err.message);
      throw err;
    }

    const updated = await this.incidentRepository.update(input.id, validatedChanges);

    this.eventEmitter.emit(
      IncidentUpdatedEvent.EVENT_NAME,
      new IncidentUpdatedEvent(before, updated.toSnapshot(), input.actorId),
    );

    return updated;
  }
}
