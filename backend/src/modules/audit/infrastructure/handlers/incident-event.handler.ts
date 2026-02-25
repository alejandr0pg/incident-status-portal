import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateAuditLogUseCase } from '../../application/use-cases/create-audit-log.use-case';
import { IncidentCreatedEvent } from '../../../incidents/domain/events/incident-created.event';
import { IncidentUpdatedEvent } from '../../../incidents/domain/events/incident-updated.event';
import { IncidentDeletedEvent } from '../../../incidents/domain/events/incident-deleted.event';

@Injectable()
export class IncidentEventHandler {
  constructor(private readonly createAuditLog: CreateAuditLogUseCase) {}

  @OnEvent(IncidentCreatedEvent.EVENT_NAME)
  async handleCreated(event: IncidentCreatedEvent): Promise<void> {
    await this.createAuditLog.execute({
      actorId: event.actorId,
      action: 'CREATE',
      entityType: 'Incident',
      entityId: event.incident.id,
      afterSnapshot: event.incident,
    });
  }

  @OnEvent(IncidentUpdatedEvent.EVENT_NAME)
  async handleUpdated(event: IncidentUpdatedEvent): Promise<void> {
    await this.createAuditLog.execute({
      actorId: event.actorId,
      action: 'UPDATE',
      entityType: 'Incident',
      entityId: event.after.id,
      beforeSnapshot: event.before,
      afterSnapshot: event.after,
    });
  }

  @OnEvent(IncidentDeletedEvent.EVENT_NAME)
  async handleDeleted(event: IncidentDeletedEvent): Promise<void> {
    await this.createAuditLog.execute({
      actorId: event.actorId,
      action: 'DELETE',
      entityType: 'Incident',
      entityId: event.incident.id,
      beforeSnapshot: event.incident,
    });
  }
}
