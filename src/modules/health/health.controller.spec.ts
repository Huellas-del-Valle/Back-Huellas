import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const mockHealthService = {
      check: jest.fn().mockResolvedValue({
        status: 'ok',
        database: 'connected',
        timestamp: '2026-10-21T08:00:00Z',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status successfully', async () => {
    const result = await controller.check();
    expect(result).toEqual({
      status: 'ok',
      database: 'connected',
      timestamp: '2026-10-21T08:00:00Z',
    });
    expect(service.check).toHaveBeenCalled();
  });
});
