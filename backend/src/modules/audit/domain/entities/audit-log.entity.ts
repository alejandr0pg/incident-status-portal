export interface AuditLogProps {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  timestamp: Date;
}

export class AuditLogEntity {
  readonly id: string;
  readonly actorId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly beforeSnapshot: Record<string, unknown> | null;
  readonly afterSnapshot: Record<string, unknown> | null;
  readonly timestamp: Date;

  constructor(props: AuditLogProps) {
    this.id = props.id;
    this.actorId = props.actorId;
    this.action = props.action;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.beforeSnapshot = props.beforeSnapshot ?? null;
    this.afterSnapshot = props.afterSnapshot ?? null;
    this.timestamp = props.timestamp;
  }

  toJSON(): AuditLogProps {
    return {
      id: this.id,
      actorId: this.actorId,
      action: this.action,
      entityType: this.entityType,
      entityId: this.entityId,
      beforeSnapshot: this.beforeSnapshot,
      afterSnapshot: this.afterSnapshot,
      timestamp: this.timestamp,
    };
  }

  static create(props: AuditLogProps): AuditLogEntity {
    return new AuditLogEntity(props);
  }
}
