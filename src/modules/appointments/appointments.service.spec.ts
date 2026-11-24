import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { Pet } from '../pets/entities/pet.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentsRepository: jest.Mocked<Repository<Appointment>>;
  let petsRepository: jest.Mocked<Repository<Pet>>;
  let clientsRepository: jest.Mocked<Repository<Client>>;
  let usersRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunnerMock: any;

  const mockDate = new Date('2026-10-22T08:00:00.000Z');

  const mockVet: User = {
    id: 'u0000000-0000-0000-0000-000000000001',
    fullName: 'Dr. Veterinario Ejemplo',
    email: 'vet@huellas.com',
    passwordHash: 'hashed',
    role: UserRole.VETERINARIO,
    isActive: true,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockClient: Client = {
    id: 'c0000000-0000-0000-0000-000000000001',
    identification: '1088000111',
    fullName: 'Cliente Ejemplo',
    phone: '3001234567',
    email: 'cliente@huellas.com',
    address: 'Calle Ejemplo 123',
    pets: [],
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockPet: Pet = {
    id: 'p0000000-0000-0000-0000-000000000001',
    uniqueCode: 'HUV-2026-0001',
    name: 'Mascota Ejemplo',
    species: 'CANINO',
    breed: 'Labrador',
    birthDate: new Date('2024-01-15T00:00:00.000Z'),
    gender: 'MACHO',
    clientId: mockClient.id,
    client: mockClient,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockAppointment: Appointment = {
    id: 'a0000000-0000-0000-0000-000000000001',
    petId: mockPet.id,
    pet: mockPet,
    clientId: mockClient.id,
    client: mockClient,
    veterinarianId: mockVet.id,
    veterinarian: mockVet,
    startDateTime: new Date('2026-10-22T09:00:00.000Z'),
    endDateTime: new Date('2026-10-22T09:30:00.000Z'),
    reason: 'Consulta médica general',
    status: AppointmentStatus.PENDIENTE,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  let transactionConflictQbMock: any;

  beforeEach(async () => {
    transactionConflictQbMock = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn().mockImplementation((entityClass, options) => {
          if (entityClass === User) {
            return Promise.resolve(mockVet);
          }
          if (entityClass === Pet) {
            return Promise.resolve(mockPet);
          }
          return Promise.resolve(null);
        }),
        createQueryBuilder: jest.fn().mockReturnValue(transactionConflictQbMock),
        create: jest.fn().mockImplementation((entityClass, data) => ({
          ...data,
          id: 'a0000000-0000-0000-0000-000000000001',
          createdAt: mockDate,
          updatedAt: mockDate,
        })),
        save: jest.fn().mockImplementation((entityClass, entity) => Promise.resolve(entity)),
      },
    };

    const mockAppointmentsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockPetsRepo = {
      findOne: jest.fn(),
    };

    const mockClientsRepo = {
      findOne: jest.fn(),
    };

    const mockUsersRepo = {
      findOne: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentsRepo,
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: mockPetsRepo,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientsRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    appointmentsRepository = module.get(getRepositoryToken(Appointment));
    petsRepository = module.get(getRepositoryToken(Pet));
    clientsRepository = module.get(getRepositoryToken(Client));
    usersRepository = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(appointmentsRepository).toBeDefined();
    expect(petsRepository).toBeDefined();
    expect(clientsRepository).toBeDefined();
    expect(usersRepository).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('create', () => {
    const validDto: CreateAppointmentDto = {
      petId: mockPet.id,
      veterinarianId: mockVet.id,
      startDateTime: '2026-10-22T09:00:00Z',
      endDateTime: '2026-10-22T09:30:00Z',
      reason: 'Consulta médica general',
    };

    it('should successfully create an appointment when there are no conflicts', async () => {
      const result = await service.create(validDto);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.manager.findOne).toHaveBeenCalledWith(User, {
        where: { id: validDto.veterinarianId },
        lock: { mode: 'pessimistic_write' },
      });
      expect(queryRunnerMock.manager.findOne).toHaveBeenCalledWith(Pet, {
        where: { id: validDto.petId },
        relations: ['client'],
      });
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();

      expect(result).toMatchObject({
        id: expect.any(String),
        status: AppointmentStatus.PENDIENTE,
        startDateTime: expect.any(String),
        endDateTime: expect.any(String),
        veterinarian: {
          id: mockVet.id,
          fullName: mockVet.fullName,
        },
        client: {
          id: mockClient.id,
          fullName: mockClient.fullName,
        },
      });
    });

    it('should reject when startDateTime is after or equal to endDateTime (400 Bad Request)', async () => {
      const invalidDto: CreateAppointmentDto = {
        ...validDto,
        startDateTime: '2026-10-22T10:00:00Z',
        endDateTime: '2026-10-22T09:00:00Z',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('should reject when dates are not valid ISO strings (400 Bad Request)', async () => {
      const invalidDto: CreateAppointmentDto = {
        ...validDto,
        startDateTime: 'fecha-invalida',
        endDateTime: '2026-10-22T09:30:00Z',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when veterinarian does not exist', async () => {
      queryRunnerMock.manager.findOne.mockImplementation(
        (entityClass: any) => {
          if (entityClass === User) return Promise.resolve(null);
          return Promise.resolve(mockPet);
        },
      );

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException when pet does not exist', async () => {
      queryRunnerMock.manager.findOne.mockImplementation(
        (entityClass: any) => {
          if (entityClass === User) return Promise.resolve(mockVet);
          if (entityClass === Pet) return Promise.resolve(null);
          return Promise.resolve(null);
        },
      );

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException (409) when veterinarian has an overlapping appointment', async () => {
      const conflictingAppointment = {
        ...mockAppointment,
        startDateTime: new Date('2026-10-22T09:15:00Z'),
        endDateTime: new Date('2026-10-22T09:45:00Z'),
      };

      transactionConflictQbMock.getOne.mockResolvedValueOnce(
        conflictingAppointment,
      );

      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('should throw ConflictException (409) when pet has an overlapping appointment', async () => {
      // First call is for vet: return null (no vet conflict)
      transactionConflictQbMock.getOne.mockResolvedValueOnce(null);
      // Second call is for pet: return conflicting appointment
      transactionConflictQbMock.getOne.mockResolvedValueOnce(mockAppointment);

      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return appointments with applied date filters', async () => {
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAppointment]),
      };

      appointmentsRepository.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.findAll({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(appointmentsRepository.createQueryBuilder).toHaveBeenCalledWith(
        'appointment',
      );
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'appointment.startDateTime >= :startDate',
        expect.any(Object),
      );
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'appointment.endDateTime <= :endDate',
        expect.any(Object),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockAppointment.id);
      expect(result[0].veterinarian.fullName).toBe(mockVet.fullName);
    });

    it('should filter by veterinarianId and status when provided', async () => {
      const qbMock: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAppointment]),
      };

      appointmentsRepository.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.findAll({
        veterinarianId: mockVet.id,
        status: AppointmentStatus.PENDIENTE,
      });

      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'appointment.veterinarianId = :veterinarianId',
        { veterinarianId: mockVet.id },
      );
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'appointment.status = :status',
        { status: AppointmentStatus.PENDIENTE },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return the appointment by id', async () => {
      appointmentsRepository.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findOne(mockAppointment.id);

      expect(appointmentsRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockAppointment.id },
        relations: ['veterinarian', 'client', 'pet'],
      });
      expect(result.id).toBe(mockAppointment.id);
      expect(result.veterinarian.id).toBe(mockVet.id);
      expect(result.client.id).toBe(mockClient.id);
    });

    it('should throw NotFoundException when appointment is not found', async () => {
      appointmentsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    const updateDto: UpdateAppointmentStatusDto = {
      status: AppointmentStatus.CONFIRMADA,
    };

    it('should successfully update status from PENDIENTE to CONFIRMADA', async () => {
      appointmentsRepository.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.PENDIENTE,
      });
      appointmentsRepository.save.mockImplementation((apt: any) =>
        Promise.resolve(apt),
      );

      const result = await service.updateStatus(
        mockAppointment.id,
        updateDto,
      );

      expect(result.status).toBe(AppointmentStatus.CONFIRMADA);
      expect(appointmentsRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to change a CANCELADA appointment', async () => {
      appointmentsRepository.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELADA,
      });

      await expect(
        service.updateStatus(mockAppointment.id, {
          status: AppointmentStatus.CONFIRMADA,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to change an ATENDIDA appointment', async () => {
      appointmentsRepository.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.ATENDIDA,
      });

      await expect(
        service.updateStatus(mockAppointment.id, {
          status: AppointmentStatus.CANCELADA,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return unchanged appointment when new status is identical', async () => {
      appointmentsRepository.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMADA,
      });

      const result = await service.updateStatus(mockAppointment.id, {
        status: AppointmentStatus.CONFIRMADA,
      });

      expect(result.status).toBe(AppointmentStatus.CONFIRMADA);
      expect(appointmentsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should mark appointment as CANCELADA', async () => {
      appointmentsRepository.findOne.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.PENDIENTE,
      });
      appointmentsRepository.save.mockImplementation((apt: any) =>
        Promise.resolve(apt),
      );

      const result = await service.cancel(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.CANCELADA);
      expect(appointmentsRepository.save).toHaveBeenCalled();
    });
  });

  describe('getAvailability', () => {
    it('should calculate available 30-min slots excluding active appointments', async () => {
      usersRepository.findOne.mockResolvedValue(mockVet);

      const bookedApt = {
        ...mockAppointment,
        startDateTime: new Date('2026-10-22T09:00:00.000Z'),
        endDateTime: new Date('2026-10-22T09:30:00.000Z'),
      };

      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([bookedApt]),
      };

      appointmentsRepository.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.getAvailability({
        veterinarianId: mockVet.id,
        date: '2026-10-22',
      });

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockVet.id },
      });
      expect(result.date).toBe('2026-10-22');
      expect(result.veterinarianId).toBe(mockVet.id);
      expect(result.workingHours).toEqual({ start: '08:00', end: '18:00' });
      expect(result.slotDurationMinutes).toBe(30);

      // Total slots between 08:00 and 18:00 is 10 hours * 2 = 20 slots
      expect(result.availableSlots).toHaveLength(20);

      // The slot 09:00-09:30 should be unavailable
      const slot9am = result.availableSlots.find(
        (s) => s.startDateTime === '2026-10-22T09:00:00.000Z',
      );
      expect(slot9am?.available).toBe(false);

      // The slot 08:30-09:00 should be available
      const slot830am = result.availableSlots.find(
        (s) => s.startDateTime === '2026-10-22T08:30:00.000Z',
      );
      expect(slot830am?.available).toBe(true);

      // Time slots list should not include 09:00 - 09:30
      expect(result.availableTimeSlots).not.toContain('09:00 - 09:30');
      expect(result.availableTimeSlots).toContain('08:30 - 09:00');
      expect(result.bookedAppointments).toHaveLength(1);
    });

    it('should throw NotFoundException if veterinarian does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAvailability({
          veterinarianId: 'u-inexistente',
          date: '2026-10-22',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid date format', async () => {
      usersRepository.findOne.mockResolvedValue(mockVet);

      await expect(
        service.getAvailability({
          veterinarianId: mockVet.id,
          date: 'invalid-date',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
