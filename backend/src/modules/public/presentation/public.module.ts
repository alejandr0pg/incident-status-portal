import { Module } from '@nestjs/common';
import { GetPublicStatusUseCase } from '../application/use-cases/get-public-status.use-case';
import { PublicController } from './public.controller';
import { IncidentsModule } from '../../incidents/presentation/incidents.module';

@Module({
  imports: [IncidentsModule],
  controllers: [PublicController],
  providers: [GetPublicStatusUseCase],
})
export class PublicModule {}
