import { BaseEntity } from '../../../../shared/domain/base.entity';
import { InvalidValueException } from '../../../../shared/domain/exceptions/domain.exception';
import { StatusVO } from '../value-objects/status.vo';
import { SeverityVO } from '../value-objects/severity.vo';
import { Severity, IncidentStatus } from './incident.enums';
export { Severity, IncidentStatus } from './incident.enums';

export interface IncidentProps {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  impactedServices: string[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UpdateIncidentProps = Partial<
  Pick<IncidentProps, 'title' | 'description' | 'severity' | 'status' | 'impactedServices'>
>;

export class IncidentEntity extends BaseEntity {
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly status: IncidentStatus;
  readonly impactedServices: ReadonlyArray<string>;
  readonly createdById: string;
  readonly updatedAt: Date;

  private constructor(props: IncidentProps) {
    super(props.id, props.createdAt);
    this.title = props.title;
    this.description = props.description;
    this.severity = props.severity;
    this.status = props.status;
    this.impactedServices = Object.freeze([...props.impactedServices]);
    this.createdById = props.createdById;
    this.updatedAt = props.updatedAt;
  }

  /** Factory for creating new incidents — enforces domain invariants */
  static new(props: Omit<IncidentProps, 'status'>): IncidentEntity {
    if (props.title.trim().length < 3) {
      throw new InvalidValueException('Title must be at least 3 characters');
    }
    if (props.description.trim().length < 10) {
      throw new InvalidValueException('Description must be at least 10 characters');
    }
    if (props.impactedServices.length === 0) {
      throw new InvalidValueException('At least one impacted service is required');
    }
    SeverityVO.create(props.severity); // validates enum
    return new IncidentEntity({ ...props, status: IncidentStatus.OPEN });
  }

  /** Factory for reconstituting from persistence — no invariant re-validation */
  static reconstitute(props: IncidentProps): IncidentEntity {
    return new IncidentEntity(props);
  }

  /** Validates proposed update and returns merged props for persistence */
  validateUpdate(changes: UpdateIncidentProps): UpdateIncidentProps {
    if (changes.title !== undefined && changes.title.trim().length < 3) {
      throw new InvalidValueException('Title must be at least 3 characters');
    }
    if (changes.description !== undefined && changes.description.trim().length < 10) {
      throw new InvalidValueException('Description must be at least 10 characters');
    }
    if (changes.severity !== undefined) {
      SeverityVO.create(changes.severity);
    }
    if (changes.status !== undefined) {
      const current = StatusVO.create(this.status);
      const next = StatusVO.create(changes.status);
      current.validateTransitionTo(next);
    }
    return changes;
  }

  isOpen(): boolean {
    return this.status === IncidentStatus.OPEN || this.status === IncidentStatus.INVESTIGATING;
  }

  isCritical(): boolean {
    return this.severity === Severity.CRITICAL;
  }

  toSnapshot(): IncidentProps {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      severity: this.severity,
      status: this.status,
      impactedServices: [...this.impactedServices],
      createdById: this.createdById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
