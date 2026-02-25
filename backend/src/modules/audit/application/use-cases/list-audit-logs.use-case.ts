import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import {
  IAuditRepository,
  AUDIT_REPOSITORY,
  PaginatedAuditResult,
} from '../../domain/repositories/audit.repository.interface';

const ListAuditLogsSchema = z.object({
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListAuditLogsInput = z.infer<typeof ListAuditLogsSchema>;

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute(input: unknown): Promise<PaginatedAuditResult> {
    const parsed = ListAuditLogsSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }

    return this.auditRepository.findAll({
      entityId: parsed.data.entityId,
      entityType: parsed.data.entityType,
      actorId: parsed.data.actorId,
      action: parsed.data.action,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });
  }
}
