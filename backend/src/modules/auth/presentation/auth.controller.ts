import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../infrastructure/strategies/jwt.strategy';

interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}

function successResponse<T>(data: T, message: string): ApiResponse<T> {
  return { data, message, timestamp: new Date().toISOString() };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<unknown>> {
    const result = await this.loginUseCase.execute(body);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return successResponse(result.user, 'Login successful');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): ApiResponse<null> {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
    });
    return successResponse(null, 'Logout successful');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request): Promise<ApiResponse<unknown>> {
    const user = req.user as AuthenticatedUser;
    const profile = await this.getMeUseCase.execute(user.id);
    return successResponse(profile, 'Profile retrieved successfully');
  }
}
