import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  IIncidentRepository,
  IncidentFilters,
  CreateIncidentData,
  UpdateIncidentData,
} from '../../domain/repositories/incident.repository.interface';
import { PaginatedResult } from '../../../../shared/application/pagination';
import { IncidentEntity, Severity, IncidentStatus } from '../../domain/entities/incident.entity';

type PrismaIncident = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  impactedServices: string[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class IncidentPrismaRepository implements IIncidentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(p: PrismaIncident): IncidentEntity {
    return IncidentEntity.reconstitute({
      id: p.id,
      title: p.title,
      description: p.description,
      severity: p.severity as Severity,
      status: p.status as IncidentStatus,
      impactedServices: p.impactedServices,
      createdById: p.createdById,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  async findAll(filters: IncidentFilters): Promise<PaginatedResult<IncidentEntity>> {
    const { page = 1, limit = 20, status, severity, createdById } = filters;
    const where: Prisma.IncidentWhereInput = {
      ...(status && { status }),
      ...(severity && { severity }),
      ...(createdById && { createdById }),
    };

    const [items, total] = await Promise.all([
      this.prisma.incident.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.incident.count({ where }),
    ]);

    return { data: items.map((i) => this.toDomain(i)), total, page, limit };
  }

  async findById(id: string): Promise<IncidentEntity | null> {
    const item = await this.prisma.incident.findUnique({ where: { id } });
    return item ? this.toDomain(item) : null;
  }

  async create(data: CreateIncidentData): Promise<IncidentEntity> {
    const item = await this.prisma.incident.create({ data });
    return this.toDomain(item);
  }

  async update(id: string, data: UpdateIncidentData): Promise<IncidentEntity> {
    const item = await this.prisma.incident.update({ where: { id }, data });
    return this.toDomain(item);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.incident.delete({ where: { id } });
  }
}
