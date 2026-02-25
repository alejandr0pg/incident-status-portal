import { PaginatedResult } from '../../../../shared/application/pagination';
import { IncidentEntity, Severity, IncidentStatus } from '../entities/incident.entity';

export interface IncidentFilters {
  status?: IncidentStatus;
  severity?: Severity;
  createdById?: string;
  page?: number;
  limit?: number;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  severity: Severity;
  impactedServices: string[];
  createdById: string;
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: IncidentStatus;
  impactedServices?: string[];
}

export interface IIncidentRepository {
  findAll(filters: IncidentFilters): Promise<PaginatedResult<IncidentEntity>>;
  findById(id: string): Promise<IncidentEntity | null>;
  create(data: CreateIncidentData): Promise<IncidentEntity>;
  update(id: string, data: UpdateIncidentData): Promise<IncidentEntity>;
  delete(id: string): Promise<void>;
}

export const INCIDENT_REPOSITORY = Symbol('IIncidentRepository');
