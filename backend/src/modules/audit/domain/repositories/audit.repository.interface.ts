import { AuditLogEntity } from '../entities/audit-log.entity';

export interface CreateAuditLogData {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
}

export interface AuditLogFilters {
  entityId?: string;
  entityType?: string;
  actorId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditResult {
  data: AuditLogEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface IAuditRepository {
  create(data: CreateAuditLogData): Promise<AuditLogEntity>;
  findAll(filters: AuditLogFilters): Promise<PaginatedAuditResult>;
}

export const AUDIT_REPOSITORY = Symbol('IAuditRepository');
