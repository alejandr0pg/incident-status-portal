import { Controller, Get } from '@nestjs/common';
import { GetPublicStatusUseCase, PublicStatusOutput } from '../application/use-cases/get-public-status.use-case';

interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}

@Controller('public')
export class PublicController {
  constructor(
    private readonly getPublicStatusUseCase: GetPublicStatusUseCase,
  ) {}

  @Get('status')
  async getStatus(): Promise<ApiResponse<PublicStatusOutput>> {
    const result = await this.getPublicStatusUseCase.execute();
    return {
      data: result,
      message: 'System status retrieved successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
