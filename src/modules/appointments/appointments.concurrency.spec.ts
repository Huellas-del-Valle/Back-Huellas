import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { Pet } from '../pets/entities/pet.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

describe('AppointmentsService Concurrency & Overlap Control (RNF-10)', () => {
  let service: AppointmentsService;

  const mockDate = new Date('2026-10-22T08:00:00.000Z');

  const vetA: User = {
    id: 'u0000000-0000-0000-0000-000000000001',
    fullName: 'Dr. Veterinario A',
    email: 'vetA@huellas.com',
    passwordHash: 'hashed',
    role: UserRole.VETERINARIO,
    isActive: true,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const vetB: User = {
    id: 'u0000000-0000-0000-0000-000000000002',
    fullName: 'Dra. Veterinaria B',
    email: 'vetB@huellas.com',
    passwordHash: 'hashed',
    role: UserRole.VETERINARIO,
    isActive: true,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const client1: Client = {
    id: 'c0000000-0000-0000-0000-000000000001',
    identification: '1088000111',
    fullName: 'Cliente 1',
    phone: '3001234567',
    email: 'c1@huellas.com',
    pets: [],
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const pet1: Pet = {
    id: 'p0000000-0000-0000-0000-000000000001',
    uniqueCode: 'HUV-2026-0001',
    name: 'Max',
    species: 'CANINO',
    breed: 'Labrador',
    birthDate: new Date('2024-01-15T00:00:00.000Z'),
    gender: 'MACHO',
    clientId: client1.id,
    client: client1,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const pet2: Pet = {
    id: 'p0000000-0000-0000-0000-000000000002',
    uniqueCode: 'HUV-2026-0002',
    name: 'Luna',
    species: 'FELINO',
    breed: 'Siames',
    birthDate: new Date('2024-02-10T00:00:00.000Z'),
    gender: 'HEMBRA',
    clientId: client1.id,
    client: client1,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  // Shared in-memory database storage simulating the MySQL tables
  let appointmentsTable: Appointment[];
  // Mutex simulation for pessimistic locks keyed by resource ID (veterinarian ID)
  const locks: Map<string, Promise<void>> = new Map();

  const acquireLock = async (key: string): Promise<() => void> => {
    while (locks.has(key)) {
      await locks.get(key);
    }
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    locks.set(key, lockPromise);

    return () => {
      locks.delete(key);
      releaseLock!();
    };
  };

  beforeEach(async () => {
    appointmentsTable = [];
    locks.clear();

    const mockDataSource = {
      createQueryRunner: () => {
        let releaseMutex: (() => void) | null = null;
        let uncommittedAppointments: Appointment[] = [];

        return {
          connect: jest.fn().mockResolvedValue(undefined),
          startTransaction: jest.fn().mockResolvedValue(undefined),
          commitTransaction: jest.fn().mockImplementation(() => {
            // Commit: persist uncommitted changes into shared table
            appointmentsTable.push(...uncommittedAppointments);
            uncommittedAppointments = [];
            if (releaseMutex) {
              releaseMutex();
              releaseMutex = null;
            }
            return Promise.resolve();
          }),
          rollbackTransaction: jest.fn().mockImplementation(() => {
            // Rollback: discard uncommitted
            uncommittedAppointments = [];
            if (releaseMutex) {
              releaseMutex();
              releaseMutex = null;
            }
            return Promise.resolve();
          }),
          release: jest.fn().mockImplementation(() => {
            if (releaseMutex) {
              releaseMutex();
              releaseMutex = null;
            }
            return Promise.resolve();
          }),
          manager: {
            findOne: jest.fn().mockImplementation(async (entityClass, options) => {
              if (entityClass === User) {
                const vetId = options?.where?.id;
                // Simulating pessimistic write lock on the veterinarian record
                if (options?.lock?.mode === 'pessimistic_write') {
                  const unlock = await acquireLock(vetId);
                  releaseMutex = unlock;
                }
                if (vetId === vetA.id) return vetA;
                if (vetId === vetB.id) return vetB;
                return null;
              }
              if (entityClass === Pet) {
                const petId = options?.where?.id;
                if (petId === pet1.id) return pet1;
                if (petId === pet2.id) return pet2;
                return null;
              }
              return null;
            }),
            createQueryBuilder: (entityClass: any, alias: string) => {
              let vetIdFilter: string | null = null;
              let petIdFilter: string | null = null;
              let startFilter: Date | null = null;
              let endFilter: Date | null = null;

              const qb: any = {
                setLock: () => qb,
                where: (clause: string, params: any) => {
                  if (params?.vetId) vetIdFilter = params.vetId;
                  if (params?.petId) petIdFilter = params.petId;
                  return qb;
                },
                andWhere: (clause: string, params: any) => {
                  if (params?.endDate) endFilter = new Date(params.endDate);
                  if (params?.startDate) startFilter = new Date(params.startDate);
                  return qb;
                },
                getOne: () => {
                  // Simulate MySQL overlap query evaluation
                  const allVisible = [...appointmentsTable, ...uncommittedAppointments];
                  const found =
                    allVisible.find((apt) => {
                      if (apt.status === AppointmentStatus.CANCELADA) return false;
                      if (vetIdFilter && apt.veterinarianId !== vetIdFilter) return false;
                      if (petIdFilter && apt.petId !== petIdFilter) return false;

                      const aptStart = new Date(apt.startDateTime).getTime();
                      const aptEnd = new Date(apt.endDateTime).getTime();
                      const newStart = startFilter!.getTime();
                      const newEnd = endFilter!.getTime();

                      // Overlap formula: (aptStart < newEnd) && (aptEnd > newStart)
                      return aptStart < newEnd && aptEnd > newStart;
                    }) || null;
                  return Promise.resolve(found);
                },
              };
              return qb;
            },
            create: (entityClass: any, data: any) => ({
              ...data,
              id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            save: (entityClass: any, entity: any) => {
              uncommittedAppointments.push(entity);
              return Promise.resolve(entity);
            },
          },
        };
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Pet),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('RNF-10: exactly ONE appointment succeeds and ONE is rejected with ConflictException (409) on two simultaneous requests for the same slot', async () => {
    const payload1: CreateAppointmentDto = {
      petId: pet1.id,
      veterinarianId: vetA.id,
      startDateTime: '2026-10-22T09:00:00Z',
      endDateTime: '2026-10-22T09:30:00Z',
      reason: 'Petición concurrente 1',
    };

    const payload2: CreateAppointmentDto = {
      petId: pet2.id,
      veterinarianId: vetA.id,
      startDateTime: '2026-10-22T09:00:00Z',
      endDateTime: '2026-10-22T09:30:00Z',
      reason: 'Petición concurrente 2',
    };

    // Disparar ambas peticiones simultáneamente en paralelo
    const results = await Promise.allSettled([
      service.create(payload1),
      service.create(payload2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Comprobación estricta del RNF-10:
    // Exactamente 1 petición se procesa exitosamente (201 Created)
    expect(fulfilled).toHaveLength(1);
    // Exactamente 1 petición es bloqueada por colisión de horario (409 Conflict)
    expect(rejected).toHaveLength(1);

    const error = (rejected[0]).reason;
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getStatus()).toBe(409);
    expect(error.message).toContain(
      'El veterinario ya cuenta con una cita en el rango de tiempo solicitado',
    );

    // Solo debe haber quedado 1 cita registrada en la base de datos
    expect(appointmentsTable).toHaveLength(1);
    expect(appointmentsTable[0].veterinarianId).toBe(vetA.id);
  });

  it('RNF-10: exactly ONE appointment succeeds and FOUR are rejected when 5 concurrent requests compete for the same slot', async () => {
    const requests = Array.from({ length: 5 }, (_, i) => ({
      petId: i % 2 === 0 ? pet1.id : pet2.id,
      veterinarianId: vetA.id,
      startDateTime: '2026-10-22T10:00:00Z',
      endDateTime: '2026-10-22T10:30:00Z',
      reason: `Intento concurrente #${i + 1}`,
    }));

    const results = await Promise.allSettled(
      requests.map((dto) => service.create(dto)),
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(4);

    for (const rej of rejected) {
      const error = (rej).reason;
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.getStatus()).toBe(409);
    }

    expect(appointmentsTable).toHaveLength(1);
  });

  it('should allow concurrent requests for DIFFERENT veterinarians for the same time slot', async () => {
    const reqVetA: CreateAppointmentDto = {
      petId: pet1.id,
      veterinarianId: vetA.id,
      startDateTime: '2026-10-22T11:00:00Z',
      endDateTime: '2026-10-22T11:30:00Z',
      reason: 'Cita con Veterinario A',
    };

    const reqVetB: CreateAppointmentDto = {
      petId: pet2.id,
      veterinarianId: vetB.id,
      startDateTime: '2026-10-22T11:00:00Z',
      endDateTime: '2026-10-22T11:30:00Z',
      reason: 'Cita con Veterinaria B',
    };

    const results = await Promise.allSettled([
      service.create(reqVetA),
      service.create(reqVetB),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(0);
    expect(appointmentsTable).toHaveLength(2);
  });

  it('should allow consecutive back-to-back appointments for the same veterinarian without conflict', async () => {
    const slot1: CreateAppointmentDto = {
      petId: pet1.id,
      veterinarianId: vetA.id,
      startDateTime: '2026-10-22T14:00:00Z',
      endDateTime: '2026-10-22T14:30:00Z',
      reason: 'Primer turno',
    };

    const slot2: CreateAppointmentDto = {
      petId: pet2.id,
      veterinarianId: vetA.id,
      startDateTime: '2026-10-22T14:30:00Z',
      endDateTime: '2026-10-22T15:00:00Z',
      reason: 'Segundo turno contiguo',
    };

    const results = await Promise.allSettled([
      service.create(slot1),
      service.create(slot2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(0);
    expect(appointmentsTable).toHaveLength(2);
  });
});
