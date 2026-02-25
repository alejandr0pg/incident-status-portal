export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidValueException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
  }
}
