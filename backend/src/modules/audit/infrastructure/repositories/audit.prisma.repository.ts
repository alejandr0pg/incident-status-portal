import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  IAuditRepository,
  CreateAuditLogData,
  AuditLogFilters,
  PaginatedAuditResult,
} from '../../domain/repositories/audit.repository.interface';
import { AuditLogEntity } from '../../domain/entities/audit-log.entity';

type PrismaAuditLog = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot: Prisma.JsonValue;
  afterSnapshot: Prisma.JsonValue;
  timestamp: Date;
};

@Injectable()
export class AuditPrismaRepository implements IAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(p: PrismaAuditLog): AuditLogEntity {
    return AuditLogEntity.create({
      id: p.id,
      actorId: p.actorId,
      action: p.action,
      entityType: p.entityType,
      entityId: p.entityId,
      beforeSnapshot: p.beforeSnapshot as unknown,
      afterSnapshot: p.afterSnapshot as unknown,
      timestamp: p.timestamp,
    });
  }

  async create(data: CreateAuditLogData): Promise<AuditLogEntity> {
    const log = await this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        beforeSnapshot: data.beforeSnapshot ?? Prisma.JsonNull,
        afterSnapshot: data.afterSnapshot ?? Prisma.JsonNull,
      },
    });
    return this.toDomain(log);
  }

  async findAll(filters: AuditLogFilters): Promise<PaginatedAuditResult> {
    const { page = 1, limit = 20, entityId, entityType, actorId, action } = filters;
    const where: Prisma.AuditLogWhereInput = {
      ...(entityId && { entityId }),
      ...(entityType && { entityType }),
      ...(actorId && { actorId }),
      ...(action && { action }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { timestamp: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: items.map((i) => this.toDomain(i)), total, page, limit };
  }
}
