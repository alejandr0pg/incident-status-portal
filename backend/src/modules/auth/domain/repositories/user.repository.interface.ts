import { UserEntity, UserRole } from '../entities/user.entity';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role?: UserRole;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
