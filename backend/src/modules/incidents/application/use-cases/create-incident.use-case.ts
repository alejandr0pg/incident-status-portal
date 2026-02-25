import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { z } from 'zod';
import {
  IIncidentRepository,
  INCIDENT_REPOSITORY,
} from '../../domain/repositories/incident.repository.interface';
import { IncidentEntity, Severity } from '../../domain/entities/incident.entity';
import { IncidentCreatedEvent } from '../../domain/events/incident-created.event';
import { DomainException } from '../../../../shared/domain/exceptions/domain.exception';

const CreateIncidentSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  severity: z.nativeEnum(Severity),
  impactedServices: z.array(z.string()).min(1),
  createdById: z.string().min(1),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

@Injectable()
export class CreateIncidentUseCase {
  constructor(
    @Inject(INCIDENT_REPOSITORY)
    private readonly incidentRepository: IIncidentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreateIncidentInput): Promise<IncidentEntity> {
    const parsed = CreateIncidentSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }

    let incident: IncidentEntity;
    try {
      // Domain invariants validated inside IncidentEntity.new()
      incident = await this.incidentRepository.create({
        title: parsed.data.title.trim(),
        description: parsed.data.description.trim(),
        severity: parsed.data.severity,
        impactedServices: parsed.data.impactedServices,
        createdById: parsed.data.createdById,
      });
    } catch (err) {
      if (err instanceof DomainException) throw new BadRequestException(err.message);
      throw err;
    }

    this.eventEmitter.emit(
      IncidentCreatedEvent.EVENT_NAME,
      new IncidentCreatedEvent(incident.toSnapshot(), parsed.data.createdById),
    );

    return incident;
  }
}
