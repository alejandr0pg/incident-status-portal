import { Module } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CreateAuditLogUseCase } from '../application/use-cases/create-audit-log.use-case';
import { ListAuditLogsUseCase } from '../application/use-cases/list-audit-logs.use-case';
import { AuditPrismaRepository } from '../infrastructure/repositories/audit.prisma.repository';
import { IncidentEventHandler } from '../infrastructure/handlers/incident-event.handler';
import { AuditController } from './audit.controller';
import { AUDIT_REPOSITORY } from '../domain/repositories/audit.repository.interface';

@Module({
  controllers: [AuditController],
  providers: [
    PrismaService,
    CreateAuditLogUseCase,
    ListAuditLogsUseCase,
    IncidentEventHandler,
    {
      provide: AUDIT_REPOSITORY,
      useClass: AuditPrismaRepository,
    },
  ],
})
export class AuditModule {}
