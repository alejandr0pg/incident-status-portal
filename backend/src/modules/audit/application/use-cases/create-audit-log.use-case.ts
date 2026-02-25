import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IAuditRepository,
  AUDIT_REPOSITORY,
  CreateAuditLogData,
} from '../../domain/repositories/audit.repository.interface';
import { AuditLogEntity } from '../../domain/entities/audit-log.entity';

@Injectable()
export class CreateAuditLogUseCase {
  private readonly logger = new Logger(CreateAuditLogUseCase.name);

  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: IAuditRepository,
  ) {}

  async execute(data: CreateAuditLogData): Promise<AuditLogEntity> {
    try {
      const auditLog = await this.auditRepository.create({
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        beforeSnapshot: data.beforeSnapshot ?? null,
        afterSnapshot: data.afterSnapshot ?? null,
      });

      this.logger.log(
        `Audit: ${data.actorId} performed ${data.action} on ${data.entityType}:${data.entityId}`,
      );

      return auditLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error as Error);
      throw error;
    }
  }
}
