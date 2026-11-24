import { Test, TestingModule } from '@nestjs/testing';
import { VaccinationsController } from './vaccinations.controller';
import { VaccinationsService } from './vaccinations.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { VaccinationRecordResponseDto } from './dto/vaccination-record-response.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';

describe('VaccinationsController', () => {
  let controller: VaccinationsController;
  let service: jest.Mocked<VaccinationsService>;

  const mockResponseDto: VaccinationRecordResponseDto = {
    id: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    petId: 'a123f1ee-6c54-4b01-90e6-d701748f0899',
    type: 'VACUNA',
    name: 'Vacuna Antirrábica Ejemplo',
    batchNumber: 'LOTE-9988',
    applicationDate: '2026-10-21',
    nextDueDate: '2027-10-21',
    notified: false,
    createdAt: new Date('2026-10-21T07:00:00Z'),
    updatedAt: new Date('2026-10-21T07:00:00Z'),
  };

  const mockReminderResponse: ReminderResponseDto = {
    message:
      'Recordatorio enviado satisfactoriamente al correo userejemplo@huellas.com',
    recipient: 'userejemplo@huellas.com',
    petName: 'Mascota ejemplo',
    sentAt: '2026-10-21T07:00:00Z',
  };

  const mockVaccinationsService = {
    create: jest.fn(),
    findByPetId: jest.fn(),
    sendManualReminder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VaccinationsController],
      providers: [
        {
          provide: VaccinationsService,
          useValue: mockVaccinationsService,
        },
      ],
    }).compile();

    controller = module.get<VaccinationsController>(VaccinationsController);
    service = module.get(VaccinationsService);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/v1/pets/:petId/vaccinations', () => {
    it('debe crear un registro de vacunación y retornar 201 Created', async () => {
      const dto: CreateVaccinationDto = {
        type: 'VACUNA',
        name: 'Vacuna Antirrábica Ejemplo',
        batchNumber: 'LOTE-9988',
        applicationDate: '2026-10-21',
        nextDueDate: '2027-10-21',
      };

      mockVaccinationsService.create.mockResolvedValue(mockResponseDto);

      const result = await controller.create(mockResponseDto.petId, dto);

      expect(service.create).toHaveBeenCalledWith(mockResponseDto.petId, dto);
      expect(result).toEqual(mockResponseDto);
    });
  });

  describe('GET /api/v1/pets/:petId/vaccinations', () => {
    it('debe listar los registros de vacunación de la mascota y retornar 200 OK', async () => {
      mockVaccinationsService.findByPetId.mockResolvedValue([mockResponseDto]);

      const result = await controller.findByPet(mockResponseDto.petId);

      expect(service.findByPetId).toHaveBeenCalledWith(mockResponseDto.petId);
      expect(result).toEqual([mockResponseDto]);
    });
  });

  describe('POST /api/v1/pets/:petId/vaccinations/:id/send-reminder', () => {
    it('debe reenviar alerta de recordatorio y retornar 200 OK con el payload especificado', async () => {
      mockVaccinationsService.sendManualReminder.mockResolvedValue(
        mockReminderResponse,
      );

      const result = await controller.sendReminder(
        mockResponseDto.petId,
        mockResponseDto.id,
      );

      expect(service.sendManualReminder).toHaveBeenCalledWith(
        mockResponseDto.petId,
        mockResponseDto.id,
      );
      expect(result).toEqual(mockReminderResponse);
      expect(result.message).toContain('userejemplo@huellas.com');
      expect(result.recipient).toBe('userejemplo@huellas.com');
      expect(result.petName).toBe('Mascota ejemplo');
    });
  });
});
