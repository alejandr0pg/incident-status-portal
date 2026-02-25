import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { ListIncidentsUseCase } from '../application/use-cases/list-incidents.use-case';
import { CreateIncidentUseCase } from '../application/use-cases/create-incident.use-case';
import { UpdateIncidentUseCase } from '../application/use-cases/update-incident.use-case';
import { DeleteIncidentUseCase } from '../application/use-cases/delete-incident.use-case';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/infrastructure/guards/roles.guard';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { Request } from 'express';

const mockListUseCase = { execute: jest.fn() };
const mockCreateUseCase = { execute: jest.fn() };
const mockUpdateUseCase = { execute: jest.fn() };
const mockDeleteUseCase = { execute: jest.fn() };

const mockUser = { id: 'user-123', email: 'user@test.com', role: UserRole.USER };

function makeReq(user = mockUser): Partial<Request> {
  return { user } as Partial<Request>;
}

async function buildController(): Promise<IncidentsController> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [IncidentsController],
    providers: [
      { provide: ListIncidentsUseCase, useValue: mockListUseCase },
      { provide: CreateIncidentUseCase, useValue: mockCreateUseCase },
      { provide: UpdateIncidentUseCase, useValue: mockUpdateUseCase },
      { provide: DeleteIncidentUseCase, useValue: mockDeleteUseCase },
    ],
  })
    .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
    .compile();

  return module.get<IncidentsController>(IncidentsController);
}

describe('IncidentsController', () => {
  let controller: IncidentsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    controller = await buildController();
  });

  describe('GET /incidents', () => {
    it('calls list use-case and wraps result in ApiResponse', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      mockListUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.findAll({ status: 'OPEN' });

      expect(mockListUseCase.execute).toHaveBeenCalledWith({ status: 'OPEN' });
      expect(result).toMatchObject({ data: mockResult, message: expect.any(String) });
    });
  });

  describe('POST /incidents', () => {
    it('calls create use-case with createdById from JWT user', async () => {
      const body = { title: 'DB issue', description: 'Pool exhausted', severity: 'HIGH', impactedServices: ['db'] };
      const snapshot = { id: 'inc-1', ...body, status: 'OPEN' };
      const created = { toSnapshot: () => snapshot } as any;
      mockCreateUseCase.execute.mockResolvedValue(created);

      const result = await controller.create(body, makeReq() as Request);

      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ ...body, createdById: mockUser.id }),
      );
      expect(result.data).toEqual(snapshot);
    });
  });

  describe('DELETE /incidents/:id', () => {
    it('passes id and UserRole enum (not string) to delete use-case', async () => {
      mockDeleteUseCase.execute.mockResolvedValue(undefined);

      await controller.remove('inc-1', makeReq() as Request);

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'inc-1', actorId: mockUser.id, actorRole: UserRole.USER }),
      );
    });
  });

  describe('Guard metadata', () => {
    it('applies JwtAuthGuard at controller class', () => {
      const guards = Reflect.getMetadata('__guards__', IncidentsController) as Function[];
      expect(guards.map((g) => g.name)).toContain('JwtAuthGuard');
    });

    it('applies RolesGuard at controller class', () => {
      const guards = Reflect.getMetadata('__guards__', IncidentsController) as Function[];
      expect(guards.map((g) => g.name)).toContain('RolesGuard');
    });
  });
});
