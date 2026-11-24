import { Test, TestingModule } from '@nestjs/testing';
import { VaccinationsCronService } from './vaccinations-cron.service';
import { VaccinationsService } from './vaccinations.service';

describe('VaccinationsCronService', () => {
  let cronService: VaccinationsCronService;
  let vaccinationsService: jest.Mocked<VaccinationsService>;

  const mockVaccinationsService = {
    processUpcomingReminders: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaccinationsCronService,
        {
          provide: VaccinationsService,
          useValue: mockVaccinationsService,
        },
      ],
    }).compile();

    cronService = module.get<VaccinationsCronService>(VaccinationsCronService);
    vaccinationsService = module.get(VaccinationsService);
  });

  it('debe estar definido el servicio Cron', () => {
    expect(cronService).toBeDefined();
  });

  it('debe ejecutar el procesamiento diario de recordatorios a las 7:00 AM', async () => {
    mockVaccinationsService.processUpcomingReminders.mockResolvedValue({
      totalEvaluated: 5,
      sent: 5,
      failed: 0,
    });

    const result = await cronService.handleDailyVaccinationReminders();

    expect(vaccinationsService.processUpcomingReminders).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      totalEvaluated: 5,
      sent: 5,
      failed: 0,
    });
  });
});
