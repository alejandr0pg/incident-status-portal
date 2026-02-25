import { GetPublicStatusUseCase } from './get-public-status.use-case';
import { IIncidentRepository } from '../../../incidents/domain/repositories/incident.repository.interface';
import { Severity, IncidentStatus, IncidentEntity } from '../../../incidents/domain/entities/incident.entity';

const mockRepo: jest.Mocked<IIncidentRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

function makeEntity(severity: Severity, status: IncidentStatus): IncidentEntity {
  return IncidentEntity.reconstitute({
    id: Math.random().toString(),
    title: 'Test incident',
    description: 'desc',
    severity,
    status,
    impactedServices: ['svc'],
    createdById: 'actor-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeResult(entities: IncidentEntity[]) {
  return { data: entities, total: entities.length, page: 1, limit: 50 };
}

describe('GetPublicStatusUseCase', () => {
  let useCase: GetPublicStatusUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetPublicStatusUseCase(mockRepo as unknown as IIncidentRepository);
  });

  it('returns major_outage when a CRITICAL OPEN incident exists', async () => {
    mockRepo.findAll.mockResolvedValue(makeResult([makeEntity(Severity.CRITICAL, IncidentStatus.OPEN)]));
    expect((await useCase.execute()).status).toBe('major_outage');
  });

  it('returns partial_outage when a HIGH OPEN incident exists', async () => {
    mockRepo.findAll.mockResolvedValue(makeResult([makeEntity(Severity.HIGH, IncidentStatus.OPEN)]));
    expect((await useCase.execute()).status).toBe('partial_outage');
  });

  it('returns degraded when a MEDIUM OPEN incident exists', async () => {
    mockRepo.findAll.mockResolvedValue(makeResult([makeEntity(Severity.MEDIUM, IncidentStatus.OPEN)]));
    expect((await useCase.execute()).status).toBe('degraded');
  });

  it('returns degraded when a LOW OPEN incident exists', async () => {
    mockRepo.findAll.mockResolvedValue(makeResult([makeEntity(Severity.LOW, IncidentStatus.OPEN)]));
    expect((await useCase.execute()).status).toBe('degraded');
  });

  it('returns operational when no incidents are open', async () => {
    mockRepo.findAll.mockResolvedValue(makeResult([makeEntity(Severity.CRITICAL, IncidentStatus.RESOLVED)]));
    expect((await useCase.execute()).status).toBe('operational');
  });

  it('returns operational when there are no incidents', async () => {
    mockRepo.findAll.mockResolvedValue(makeResult([]));
    expect((await useCase.execute()).status).toBe('operational');
  });

  it('CRITICAL takes precedence over HIGH', async () => {
    mockRepo.findAll.mockResolvedValue(makeResult([
      makeEntity(Severity.HIGH, IncidentStatus.OPEN),
      makeEntity(Severity.CRITICAL, IncidentStatus.OPEN),
    ]));
    expect((await useCase.execute()).status).toBe('major_outage');
  });

  it('sets generatedAt to current time', async () => {
    mockRepo.findAll.mockResolvedValue(makeResult([]));
    const before = Date.now();
    const result = await useCase.execute();
    expect(new Date(result.generatedAt).getTime()).toBeGreaterThanOrEqual(before);
  });
});
