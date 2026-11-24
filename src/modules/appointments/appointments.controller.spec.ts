import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from './enums/appointment-status.enum';
import {
  AppointmentQueryDto,
  AppointmentResponseDto,
  AvailabilityQueryDto,
  AvailabilityResponseDto,
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const mockAppointmentResponse: AppointmentResponseDto = {
    id: 'a0000000-0000-0000-0000-000000000001',
    status: AppointmentStatus.PENDIENTE,
    startDateTime: '2026-10-22T09:00:00.000Z',
    endDateTime: '2026-10-22T09:30:00.000Z',
    veterinarian: {
      id: 'u0000000-0000-0000-0000-000000000001',
      fullName: 'user ejemplo',
    },
    client: {
      id: 'c0000000-0000-0000-0000-000000000001',
      fullName: 'user ejemplo',
    },
    pet: {
      id: 'p0000000-0000-0000-0000-000000000001',
      name: 'Mascota ejemplo',
      uniqueCode: 'HUV-2026-0001',
    },
    reason: 'Consulta médica general',
  };

  const mockAvailabilityResponse: AvailabilityResponseDto = {
    veterinarianId: 'u0000000-0000-0000-0000-000000000001',
    veterinarianName: 'user ejemplo',
    date: '2026-10-22',
    workingHours: { start: '08:00', end: '18:00' },
    slotDurationMinutes: 30,
    availableSlots: [],
    availableTimeSlots: ['08:00 - 08:30'],
    bookedAppointments: [],
  };

  const mockAppointmentsService = {
    create: jest.fn().mockResolvedValue(mockAppointmentResponse),
    findAll: jest.fn().mockResolvedValue([mockAppointmentResponse]),
    findOne: jest.fn().mockResolvedValue(mockAppointmentResponse),
    updateStatus: jest.fn().mockResolvedValue({
      ...mockAppointmentResponse,
      status: AppointmentStatus.CONFIRMADA,
    }),
    cancel: jest.fn().mockResolvedValue({
      ...mockAppointmentResponse,
      status: AppointmentStatus.CANCELADA,
    }),
    getAvailability: jest.fn().mockResolvedValue(mockAvailabilityResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should delegate creation to appointmentsService.create', async () => {
      const dto: CreateAppointmentDto = {
        petId: 'p0000000-0000-0000-0000-000000000001',
        veterinarianId: 'u0000000-0000-0000-0000-000000000001',
        startDateTime: '2026-10-22T09:00:00Z',
        endDateTime: '2026-10-22T09:30:00Z',
        reason: 'Consulta médica general',
      };

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAppointmentResponse);
    });
  });

  describe('getAvailability', () => {
    it('should delegate availability check to appointmentsService.getAvailability', async () => {
      const query: AvailabilityQueryDto = {
        veterinarianId: 'u0000000-0000-0000-0000-000000000001',
        date: '2026-10-22',
      };

      const result = await controller.getAvailability(query);

      expect(service.getAvailability).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockAvailabilityResponse);
    });
  });

  describe('findAll', () => {
    it('should delegate search to appointmentsService.findAll', async () => {
      const query: AppointmentQueryDto = {
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      };

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual([mockAppointmentResponse]);
    });
  });

  describe('findOne', () => {
    it('should delegate search by id to appointmentsService.findOne', async () => {
      const result = await controller.findOne(mockAppointmentResponse.id);

      expect(service.findOne).toHaveBeenCalledWith(mockAppointmentResponse.id);
      expect(result).toEqual(mockAppointmentResponse);
    });
  });

  describe('updateStatus', () => {
    it('should delegate status update to appointmentsService.updateStatus', async () => {
      const dto: UpdateAppointmentStatusDto = {
        status: AppointmentStatus.CONFIRMADA,
      };

      const result = await controller.updateStatus(
        mockAppointmentResponse.id,
        dto,
      );

      expect(service.updateStatus).toHaveBeenCalledWith(
        mockAppointmentResponse.id,
        dto,
      );
      expect(result.status).toBe(AppointmentStatus.CONFIRMADA);
    });
  });

  describe('cancel', () => {
    it('should delegate cancellation to appointmentsService.cancel', async () => {
      const result = await controller.cancel(mockAppointmentResponse.id);

      expect(service.cancel).toHaveBeenCalledWith(mockAppointmentResponse.id);
      expect(result.status).toBe(AppointmentStatus.CANCELADA);
    });
  });
});
