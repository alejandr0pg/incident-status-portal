import { InvalidValueException } from '../../../../shared/domain/exceptions/domain.exception';
import { Severity } from '../entities/incident.enums';

const SEVERITY_ORDER: Severity[] = [
  Severity.LOW,
  Severity.MEDIUM,
  Severity.HIGH,
  Severity.CRITICAL,
];

export class SeverityVO {
  private readonly value: Severity;
  private static readonly VALID_VALUES = Object.values(Severity);

  private constructor(value: Severity) {
    this.value = value;
  }

  static create(value: string): SeverityVO {
    if (!SeverityVO.VALID_VALUES.includes(value as Severity)) {
      throw new InvalidValueException(
        `Invalid severity: "${value}". Must be one of: ${SeverityVO.VALID_VALUES.join(', ')}`,
      );
    }
    return new SeverityVO(value as Severity);
  }

  getValue(): Severity {
    return this.value;
  }

  isHigherThan(other: SeverityVO): boolean {
    return SEVERITY_ORDER.indexOf(this.value) > SEVERITY_ORDER.indexOf(other.getValue());
  }

  equals(other: SeverityVO): boolean {
    return this.value === other.value;
  }
}
