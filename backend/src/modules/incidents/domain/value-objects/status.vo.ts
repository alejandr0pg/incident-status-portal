import {
  InvalidValueException,
  BusinessRuleViolationException,
} from '../../../../shared/domain/exceptions/domain.exception';
import { IncidentStatus } from '../entities/incident.enums';

type StatusTransitions = Record<IncidentStatus, IncidentStatus[]>;

const TRANSITIONS: StatusTransitions = {
  [IncidentStatus.OPEN]: [IncidentStatus.INVESTIGATING, IncidentStatus.CLOSED],
  [IncidentStatus.INVESTIGATING]: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
  [IncidentStatus.RESOLVED]: [IncidentStatus.CLOSED],
  [IncidentStatus.CLOSED]: [],
};

export class StatusVO {
  private readonly value: IncidentStatus;
  private static readonly VALID_VALUES = Object.values(IncidentStatus);

  private constructor(value: IncidentStatus) {
    this.value = value;
  }

  static create(value: string): StatusVO {
    if (!StatusVO.VALID_VALUES.includes(value as IncidentStatus)) {
      throw new InvalidValueException(
        `Invalid status: "${value}". Must be one of: ${StatusVO.VALID_VALUES.join(', ')}`,
      );
    }
    return new StatusVO(value as IncidentStatus);
  }

  getValue(): IncidentStatus {
    return this.value;
  }

  canTransitionTo(next: StatusVO): boolean {
    return (TRANSITIONS[this.value] ?? []).includes(next.getValue());
  }

  validateTransitionTo(next: StatusVO): void {
    if (!this.canTransitionTo(next)) {
      throw new BusinessRuleViolationException(
        `Cannot transition incident from "${this.value}" to "${next.getValue()}"`,
      );
    }
  }

  equals(other: StatusVO): boolean {
    return this.value === other.value;
  }
}
