import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { UserPrismaRepository } from '../infrastructure/repositories/user.prisma.repository';
import { JwtStrategy } from '../infrastructure/strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { USER_REPOSITORY } from '../domain/repositories/user.repository.interface';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env['JWT_SECRET'] ?? 'fallback-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    LoginUseCase,
    GetMeUseCase,
    JwtStrategy,
    {
      provide: USER_REPOSITORY,
      useClass: UserPrismaRepository,
    },
  ],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
