import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../pets/entities/pet.entity';
import { Client } from '../clients/entities/client.entity';
import { MailService } from '../mail/mail.service';
import { VaccinationRecord } from './entities/vaccination-record.entity';
import { VaccinationsService } from './vaccinations.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';

describe('VaccinationsService', () => {
  let service: VaccinationsService;
  let vaccinationRepository: jest.Mocked<Repository<VaccinationRecord>>;
  let petRepository: jest.Mocked<Repository<Pet>>;
  let mailService: jest.Mocked<MailService>;

  const mockClient: Client = {
    id: 'a0000000-0000-0000-0000-000000000001',
    identification: '1088000111',
    fullName: 'user ejemplo',
    phone: '3001234567',
    email: 'userejemplo@huellas.com',
    address: 'Calle Ejemplo 123',
    pets: [],
    createdAt: new Date('2026-10-21T00:00:00.000Z'),
    updatedAt: new Date('2026-10-21T00:00:00.000Z'),
  };

  const mockPet: Pet = {
    id: 'b0000000-0000-0000-0000-000000000001',
    uniqueCode: 'HUV-2026-0001',
    name: 'Mascota ejemplo',
    species: 'CANINO',
    breed: 'Labrador',
    birthDate: new Date('2024-01-15'),
    gender: 'MACHO',
    clientId: mockClient.id,
    client: mockClient,
    vaccinationRecords: [],
    createdAt: new Date('2026-10-21T00:00:00.000Z'),
    updatedAt: new Date('2026-10-21T00:00:00.000Z'),
  };

  const mockVaccinationRecord: VaccinationRecord = {
    id: 'v0000000-0000-0000-0000-000000000001',
    petId: mockPet.id,
    pet: mockPet,
    type: 'VACUNA',
    name: 'Vacuna Antirrábica Ejemplo',
    batchNumber: 'LOTE-9988',
    applicationDate: '2026-10-21',
    nextDueDate: '2027-10-21',
    notified: false,
    createdAt: new Date('2026-10-21T07:00:00.000Z'),
    updatedAt: new Date('2026-10-21T07:00:00.000Z'),
  };

  const mockVaccinationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockPetRepository = {
    findOne: jest.fn(),
  };

  const mockMailService = {
    sendVaccinationReminder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaccinationsService,
        {
          provide: getRepositoryToken(VaccinationRecord),
          useValue: mockVaccinationRepository,
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: mockPetRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<VaccinationsService>(VaccinationsService);
    vaccinationRepository = module.get(getRepositoryToken(VaccinationRecord));
    petRepository = module.get(getRepositoryToken(Pet));
    mailService = module.get(MailService);
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('create - Registro de vacunas/desparasitaciones', () => {
    const createDto: CreateVaccinationDto = {
      type: 'VACUNA',
      name: 'Vacuna Antirrábica Ejemplo',
      batchNumber: 'LOTE-9988',
      applicationDate: '2026-10-21',
      nextDueDate: '2027-10-21',
    };

    it('debe registrar exitosamente un plan de vacunación con notified: false', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      vaccinationRepository.create.mockReturnValue({
        ...mockVaccinationRecord,
        id: undefined as any,
      });
      vaccinationRepository.save.mockResolvedValue(mockVaccinationRecord);

      const result = await service.create(mockPet.id, createDto);

      expect(petRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPet.id },
      });
      expect(vaccinationRepository.create).toHaveBeenCalledWith({
        petId: mockPet.id,
        type: 'VACUNA',
        name: 'Vacuna Antirrábica Ejemplo',
        batchNumber: 'LOTE-9988',
        applicationDate: '2026-10-21',
        nextDueDate: '2027-10-21',
        notified: false,
      });
      expect(vaccinationRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(mockVaccinationRecord.id);
      expect(result.notified).toBe(false);
      expect(result.batchNumber).toBe('LOTE-9988');
    });

    it('debe lanzar NotFoundException si la mascota no existe', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.create('uuid-inexistente', createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(vaccinationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByPetId - Consulta de histórico de vacunación', () => {
    it('debe retornar el esquema de vacunación ordenado para una mascota', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      vaccinationRepository.find.mockResolvedValue([mockVaccinationRecord]);

      const result = await service.findByPetId(mockPet.id);

      expect(petRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPet.id },
      });
      expect(vaccinationRepository.find).toHaveBeenCalledWith({
        where: { petId: mockPet.id },
        order: { applicationDate: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Vacuna Antirrábica Ejemplo');
    });

    it('debe lanzar NotFoundException si la mascota no existe', async () => {
      petRepository.findOne.mockResolvedValue(null);

      await expect(service.findByPetId('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('sendManualReminder - Reenvío manual de alerta', () => {
    it('debe despachar recordatorio al propietario y marcar notified: true con contrato 200 OK', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      vaccinationRepository.findOne.mockResolvedValue({
        ...mockVaccinationRecord,
        notified: false,
      });
      mailService.sendVaccinationReminder.mockResolvedValue({
        messageId: 'msg-123',
        accepted: [mockClient.email],
        rejected: [],
        simulated: true,
      });
      vaccinationRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );

      const result = await service.sendManualReminder(
        mockPet.id,
        mockVaccinationRecord.id,
      );

      expect(petRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPet.id },
      });
      expect(vaccinationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockVaccinationRecord.id, petId: mockPet.id },
        relations: ['pet', 'pet.client'],
      });
      expect(mailService.sendVaccinationReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockClient.email,
          ownerName: mockClient.fullName,
          petName: mockPet.name,
          vaccinationName: mockVaccinationRecord.name,
        }),
      );
      expect(vaccinationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ notified: true }),
      );

      // Verificación estricta del contrato de respuesta solicitado
      expect(result.message).toBe(
        `Recordatorio enviado satisfactoriamente al correo ${mockClient.email}`,
      );
      expect(result.recipient).toBe(mockClient.email);
      expect(result.petName).toBe(mockPet.name);
      expect(result.sentAt).toBeDefined();
    });

    it('debe lanzar NotFoundException si el registro no pertenece a la mascota o no existe', async () => {
      petRepository.findOne.mockResolvedValue(mockPet);
      vaccinationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.sendManualReminder(mockPet.id, 'id-erroneo'),
      ).rejects.toThrow(NotFoundException);
      expect(mailService.sendVaccinationReminder).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el propietario no tiene email registrado', async () => {
      const petWithoutClientEmail: Pet = {
        ...mockPet,
        client: { ...mockClient, email: '' },
      };

      petRepository.findOne.mockResolvedValue(mockPet);
      vaccinationRepository.findOne.mockResolvedValue({
        ...mockVaccinationRecord,
        pet: petWithoutClientEmail,
      });

      await expect(
        service.sendManualReminder(mockPet.id, mockVaccinationRecord.id),
      ).rejects.toThrow(BadRequestException);
      expect(mailService.sendVaccinationReminder).not.toHaveBeenCalled();
    });
  });

  describe('Cálculo de fechas límite & Umbrales (calculateDueDateThreshold / isRecordDueForReminder)', () => {
    it('debe calcular exactamente la fecha límite para 3 días a partir de una fecha base', () => {
      const baseDate = new Date('2026-10-21T07:00:00Z');
      const threshold = service.calculateDueDateThreshold(baseDate, 3);
      expect(threshold).toBe('2026-10-24');
    });

    it('debe calcular correctamente el umbral cruzando el fin de mes', () => {
      const baseDate = new Date('2026-10-30T10:00:00Z');
      const threshold = service.calculateDueDateThreshold(baseDate, 3);
      expect(threshold).toBe('2026-11-02');
    });

    it('debe calcular correctamente el umbral cruzando el fin de año', () => {
      const baseDate = new Date('2026-12-30T10:00:00Z');
      const threshold = service.calculateDueDateThreshold(baseDate, 3);
      expect(threshold).toBe('2027-01-02');
    });

    it('debe determinar si un refuerzo califica para recordatorio dentro del umbral de 3 días', () => {
      const baseDate = new Date('2026-10-21T07:00:00Z');

      // Vence en 1 día: Sí califica
      expect(service.isRecordDueForReminder('2026-10-22', baseDate, 3)).toBe(true);
      // Vence en exactamente 3 días: Sí califica
      expect(service.isRecordDueForReminder('2026-10-24', baseDate, 3)).toBe(true);
      // Ya vencido (anterior a hoy): Sí califica (pendiente de refuerzo)
      expect(service.isRecordDueForReminder('2026-10-20', baseDate, 3)).toBe(true);
      // Vence en 5 días: NO califica todavía
      expect(service.isRecordDueForReminder('2026-10-26', baseDate, 3)).toBe(false);
    });
  });

  describe('processUpcomingReminders - Cron Job de notificaciones automáticas', () => {
    it('debe procesar registros próximos a 3 días o menos, enviar correos y marcar notified: true', async () => {
      const pendingRecord: VaccinationRecord = {
        ...mockVaccinationRecord,
        id: 'rec-due-soon',
        nextDueDate: '2026-10-24',
        notified: false,
      };

      vaccinationRepository.find.mockResolvedValue([pendingRecord]);
      mailService.sendVaccinationReminder.mockResolvedValue({
        messageId: 'msg-cron-1',
        accepted: [mockClient.email],
        rejected: [],
        simulated: true,
      });
      vaccinationRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );

      const baseDate = new Date('2026-10-21T07:00:00Z');
      const result = await service.processUpcomingReminders(baseDate, 3);

      expect(vaccinationRepository.find).toHaveBeenCalled();
      expect(mailService.sendVaccinationReminder).toHaveBeenCalledTimes(1);
      expect(vaccinationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ notified: true }),
      );
      expect(result).toEqual({
        totalEvaluated: 1,
        sent: 1,
        failed: 0,
      });
    });

    it('debe continuar procesando los demás registros de forma no bloqueante si uno falla (RNF-13)', async () => {
      const recordFailing: VaccinationRecord = {
        ...mockVaccinationRecord,
        id: 'rec-fail',
        pet: {
          ...mockPet,
          name: 'Mascota Fallida',
          client: { ...mockClient, email: 'invalido@fallo.com' },
        },
        notified: false,
      };

      const recordSuccess: VaccinationRecord = {
        ...mockVaccinationRecord,
        id: 'rec-ok',
        pet: {
          ...mockPet,
          name: 'Mascota Exitosa',
          client: { ...mockClient, email: 'exito@huellas.com' },
        },
        notified: false,
      };

      vaccinationRepository.find.mockResolvedValue([recordFailing, recordSuccess]);

      // Primer correo falla, segundo es exitoso
      mailService.sendVaccinationReminder
        .mockRejectedValueOnce(new Error('SMTP Connection timeout'))
        .mockResolvedValueOnce({
          messageId: 'msg-cron-2',
          accepted: ['exito@huellas.com'],
          rejected: [],
          simulated: true,
        });

      vaccinationRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as any),
      );

      const result = await service.processUpcomingReminders(new Date('2026-10-21'), 3);

      expect(result.totalEvaluated).toBe(2);
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      // El registro exitoso se marca notified: true
      expect(vaccinationRepository.save).toHaveBeenCalledTimes(1);
      expect(vaccinationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'rec-ok', notified: true }),
      );
    });

    it('debe ignorar y contabilizar como fallo registros donde el propietario no tenga email', async () => {
      const recordNoEmail: VaccinationRecord = {
        ...mockVaccinationRecord,
        id: 'rec-no-email',
        pet: {
          ...mockPet,
          client: { ...mockClient, email: '' },
        },
        notified: false,
      };

      vaccinationRepository.find.mockResolvedValue([recordNoEmail]);

      const result = await service.processUpcomingReminders(new Date('2026-10-21'), 3);

      expect(mailService.sendVaccinationReminder).not.toHaveBeenCalled();
      expect(vaccinationRepository.save).not.toHaveBeenCalled();
      expect(result.failed).toBe(1);
      expect(result.sent).toBe(0);
    });
  });
});
