import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/infrastructure/guards/roles.guard';
import { Roles } from '../../../shared/infrastructure/decorators/roles.decorator';
import { ListAuditLogsUseCase } from '../application/use-cases/list-audit-logs.use-case';

interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly listAuditLogsUseCase: ListAuditLogsUseCase) {}

  @Get()
  async findAll(@Query() query: unknown): Promise<ApiResponse<unknown>> {
    const result = await this.listAuditLogsUseCase.execute(query);
    return {
      data: result,
      message: 'Audit logs retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
