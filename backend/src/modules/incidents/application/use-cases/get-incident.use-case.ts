import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import {
  IIncidentRepository,
  INCIDENT_REPOSITORY,
} from "../../domain/repositories/incident.repository.interface";
import { IncidentEntity } from "../../domain/entities/incident.entity";

@Injectable()
export class GetIncidentUseCase {
  constructor(
    @Inject(INCIDENT_REPOSITORY)
    private readonly incidentRepository: IIncidentRepository,
  ) {}

  async execute(id: string): Promise<IncidentEntity> {
    const incident = await this.incidentRepository.findById(id);
    if (!incident) {
      throw new NotFoundException(`Incident with id ${id} not found`);
    }
    return incident;
  }
}
