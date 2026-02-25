import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/presentation/auth.module';
import { IncidentsModule } from './modules/incidents/presentation/incidents.module';
import { AuditModule } from './modules/audit/presentation/audit.module';
import { PublicModule } from './modules/public/presentation/public.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: false }),
    AuthModule,
    IncidentsModule,
    AuditModule,
    PublicModule,
  ],
})
export class AppModule {}
