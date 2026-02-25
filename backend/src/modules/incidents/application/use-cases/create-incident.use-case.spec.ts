import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateIncidentUseCase } from './create-incident.use-case';
import { IIncidentRepository } from '../../domain/repositories/incident.repository.interface';
import { Severity, IncidentStatus, IncidentEntity } from '../../domain/entities/incident.entity';

const mockRepo: jest.Mocked<IIncidentRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;

const validInput = {
  title: 'API Gateway Down',
  description: 'The API gateway is not responding to requests',
  severity: Severity.CRITICAL,
  impactedServices: ['api-gateway'],
  createdById: 'user-123',
};

function fakeIncident(overrides: Partial<ReturnType<IncidentEntity['toSnapshot']>> = {}) {
  const props = { id: 'inc-1', ...validInput, status: IncidentStatus.OPEN, createdAt: new Date(), updatedAt: new Date(), ...overrides };
  return IncidentEntity.reconstitute(props);
}

describe('CreateIncidentUseCase', () => {
  let useCase: CreateIncidentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateIncidentUseCase(mockRepo as unknown as IIncidentRepository, mockEventEmitter);
  });

  it('creates an incident and returns the entity', async () => {
    mockRepo.create.mockResolvedValue(fakeIncident());

    const result = await useCase.execute(validInput);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: validInput.title, createdById: validInput.createdById }),
    );
    expect(result).toBeDefined();
  });

  it('emits IncidentCreatedEvent after creation', async () => {
    mockRepo.create.mockResolvedValue(fakeIncident());

    await useCase.execute(validInput);

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'incident.created',
      expect.objectContaining({ actorId: validInput.createdById }),
    );
  });

  it('throws BadRequestException when title is too short', async () => {
    await expect(useCase.execute({ ...validInput, title: 'AB' })).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when description is too short', async () => {
    await expect(useCase.execute({ ...validInput, description: 'short' })).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for invalid severity enum', async () => {
    await expect(
      useCase.execute({ ...validInput, severity: 'INVALID' as unknown as Severity }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when impactedServices is empty', async () => {
    await expect(useCase.execute({ ...validInput, impactedServices: [] })).rejects.toThrow(BadRequestException);
  });
});
