import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import {
  IIncidentRepository,
  INCIDENT_REPOSITORY,
} from '../../domain/repositories/incident.repository.interface';
import { PaginatedResult } from '../../../../shared/application/pagination';
import { IncidentEntity, Severity, IncidentStatus } from '../../domain/entities/incident.entity';

const ListIncidentsSchema = z.object({
  status: z.nativeEnum(IncidentStatus).optional(),
  severity: z.nativeEnum(Severity).optional(),
  createdById: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListIncidentsInput = z.infer<typeof ListIncidentsSchema>;

@Injectable()
export class ListIncidentsUseCase {
  constructor(
    @Inject(INCIDENT_REPOSITORY)
    private readonly incidentRepository: IIncidentRepository,
  ) {}

  async execute(input: unknown): Promise<PaginatedResult<IncidentEntity>> {
    const parsed = ListIncidentsSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }

    return this.incidentRepository.findAll({
      status: parsed.data.status,
      severity: parsed.data.severity,
      createdById: parsed.data.createdById,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
  }
}
