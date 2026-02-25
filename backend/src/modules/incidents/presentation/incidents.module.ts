import { Module } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { CreateIncidentUseCase } from '../application/use-cases/create-incident.use-case';
import { ListIncidentsUseCase } from '../application/use-cases/list-incidents.use-case';
import { UpdateIncidentUseCase } from '../application/use-cases/update-incident.use-case';
import { DeleteIncidentUseCase } from '../application/use-cases/delete-incident.use-case';
import { IncidentPrismaRepository } from '../infrastructure/repositories/incident.prisma.repository';
import { IncidentsController } from './incidents.controller';
import { INCIDENT_REPOSITORY } from '../domain/repositories/incident.repository.interface';

@Module({
  controllers: [IncidentsController],
  providers: [
    PrismaService,
    CreateIncidentUseCase,
    ListIncidentsUseCase,
    UpdateIncidentUseCase,
    DeleteIncidentUseCase,
    {
      provide: INCIDENT_REPOSITORY,
      useClass: IncidentPrismaRepository,
    },
  ],
  exports: [
    { provide: INCIDENT_REPOSITORY, useClass: IncidentPrismaRepository },
    PrismaService,
  ],
})
export class IncidentsModule {}
