import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../shared/infrastructure/guards/jwt-auth.guard";
import { RolesGuard } from "../../../shared/infrastructure/guards/roles.guard";
import { Roles } from "../../../shared/infrastructure/decorators/roles.decorator";
import { CreateIncidentUseCase } from "../application/use-cases/create-incident.use-case";
import { GetIncidentUseCase } from "../application/use-cases/get-incident.use-case";
import { ListIncidentsUseCase } from "../application/use-cases/list-incidents.use-case";
import { UpdateIncidentUseCase } from "../application/use-cases/update-incident.use-case";
import { DeleteIncidentUseCase } from "../application/use-cases/delete-incident.use-case";
import { AuthenticatedUser } from "../../auth/infrastructure/strategies/jwt.strategy";
import { UserRole } from "../../auth/domain/entities/user.entity";

interface ApiResponse<T> {
  data: T;
  message: string;
  timestamp: string;
}

function ok<T>(data: T, message: string): ApiResponse<T> {
  return { data, message, timestamp: new Date().toISOString() };
}

@Controller("incidents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
  constructor(
    private readonly createUseCase: CreateIncidentUseCase,
    private readonly getUseCase: GetIncidentUseCase,
    private readonly listUseCase: ListIncidentsUseCase,
    private readonly updateUseCase: UpdateIncidentUseCase,
    private readonly deleteUseCase: DeleteIncidentUseCase,
  ) {}

  @Get()
  async findAll(@Query() query: unknown): Promise<ApiResponse<unknown>> {
    const result = await this.listUseCase.execute(query);
    return ok(result, "Incidents retrieved successfully");
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<ApiResponse<unknown>> {
    const incident = await this.getUseCase.execute(id);
    return ok(incident.toSnapshot(), "Incident retrieved successfully");
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as AuthenticatedUser;
    const incident = await this.createUseCase.execute({
      ...(body as object),
      createdById: user.id,
    } as Parameters<typeof this.createUseCase.execute>[0]);
    return ok(incident.toSnapshot(), "Incident created successfully");
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<ApiResponse<unknown>> {
    const user = req.user as AuthenticatedUser;
    const incident = await this.updateUseCase.execute({
      ...(body as object),
      id,
      actorId: user.id,
    } as Parameters<typeof this.updateUseCase.execute>[0]);
    return ok(incident.toSnapshot(), "Incident updated successfully");
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @Req() req: Request): Promise<void> {
    const user = req.user as AuthenticatedUser;
    await this.deleteUseCase.execute({
      id,
      actorId: user.id,
      actorRole: user.role as UserRole,
    });
  }
}
