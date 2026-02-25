import { BaseEntity } from '../../../../shared/domain/base.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export class UserEntity extends BaseEntity {
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;

  constructor(props: UserProps) {
    super(props.id, props.createdAt);
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  toPublicProfile(): Omit<UserProps, 'passwordHash'> {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
    };
  }

  static create(props: UserProps): UserEntity {
    return new UserEntity(props);
  }
}
