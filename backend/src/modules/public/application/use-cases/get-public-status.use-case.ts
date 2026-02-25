import { Injectable, Inject } from '@nestjs/common';
import {
  IIncidentRepository,
  INCIDENT_REPOSITORY,
} from '../../../incidents/domain/repositories/incident.repository.interface';
import { IncidentEntity, Severity, IncidentStatus } from '../../../incidents/domain/entities/incident.entity';

export type SystemStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage';

export interface PublicIncidentSummary {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  impactedServices: string[];
  createdAt: Date;
}

export interface PublicStatusOutput {
  status: SystemStatus;
  incidents: PublicIncidentSummary[];
  generatedAt: string;
}

@Injectable()
export class GetPublicStatusUseCase {
  constructor(
    @Inject(INCIDENT_REPOSITORY)
    private readonly incidentRepository: IIncidentRepository,
  ) {}

  private computeStatus(incidents: IncidentEntity[]): SystemStatus {
    const openIncidents = incidents.filter(
      (i) => i.status === IncidentStatus.OPEN || i.status === IncidentStatus.INVESTIGATING,
    );

    if (openIncidents.length === 0) return 'operational';

    const hasCritical = openIncidents.some((i) => i.severity === Severity.CRITICAL);
    if (hasCritical) return 'major_outage';

    const hasHigh = openIncidents.some((i) => i.severity === Severity.HIGH);
    if (hasHigh) return 'partial_outage';

    return 'degraded';
  }

  async execute(): Promise<PublicStatusOutput> {
    const result = await this.incidentRepository.findAll({
      page: 1,
      limit: 50,
    });

    const activeIncidents = result.data.filter(
      (i) => i.status !== IncidentStatus.CLOSED,
    );

    const status = this.computeStatus(activeIncidents);

    const incidents: PublicIncidentSummary[] = activeIncidents.map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
      impactedServices: [...i.impactedServices],
      createdAt: i.createdAt,
    }));

    return {
      status,
      incidents,
      generatedAt: new Date().toISOString(),
    };
  }
}
