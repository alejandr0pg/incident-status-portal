export abstract class BaseEntity {
  readonly id: string;
  readonly createdAt: Date;

  constructor(id: string, createdAt: Date) {
    this.id = id;
    this.createdAt = createdAt;
  }

  equals(other: BaseEntity): boolean {
    if (!(other instanceof BaseEntity)) return false;
    return this.id === other.id;
  }
}
