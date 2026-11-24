import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { Pet } from '../pets/entities/pet.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import {
  AppointmentQueryDto,
  AppointmentResponseDto,
  AvailabilityQueryDto,
  AvailabilityResponseDto,
  BookedAppointmentSummaryDto,
  CreateAppointmentDto,
  TimeSlotDto,
  UpdateAppointmentStatusDto,
} from './dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea una nueva cita médica ejecutando validaciones transaccionales y
   * bloqueo pesimista para evitar solapamientos y citas duplicadas en concurrencia.
   */
  async create(dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const startDate = new Date(dto.startDateTime);
    const endDate = new Date(dto.endDateTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException(
        'Las fechas proporcionadas no tienen un formato ISO 8601 válido',
      );
    }

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha y hora de inicio debe ser estrictamente anterior a la de finalización',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo pesimista sobre el veterinario para serializar reservas simultáneas
      const vet = await queryRunner.manager.findOne(User, {
        where: { id: dto.veterinarianId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!vet) {
        throw new NotFoundException(
          `Veterinario con ID ${dto.veterinarianId} no encontrado`,
        );
      }

      // 2. Verificar existencia de la mascota y su relación con el cliente
      const pet = await queryRunner.manager.findOne(Pet, {
        where: { id: dto.petId },
        relations: ['client'],
      });

      if (!pet) {
        throw new NotFoundException(
          `Mascota con ID ${dto.petId} no encontrada`,
        );
      }

      const client = pet.client;
      if (!client) {
        throw new NotFoundException(
          'No se encontró el propietario asociado a la mascota',
        );
      }

      // 3. Control estricto de solapamiento de turno para el veterinario
      // Existe solapamiento si: (appointment.start < newEnd) Y (appointment.end > newStart)
      // Se excluyen citas con estado CANCELADA
      const conflictingVetAppointment = await queryRunner.manager
        .createQueryBuilder(Appointment, 'appointment')
        .setLock('pessimistic_write')
        .where('appointment.veterinarian_id = :vetId', {
          vetId: dto.veterinarianId,
        })
        .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: [AppointmentStatus.CANCELADA],
        })
        .andWhere('appointment.start_date_time < :endDate', { endDate })
        .andWhere('appointment.end_date_time > :startDate', { startDate })
        .getOne();

      if (conflictingVetAppointment) {
        throw new ConflictException(
          'El veterinario ya cuenta con una cita en el rango de tiempo solicitado',
        );
      }

      // 4. Control de solapamiento para la misma mascota
      const conflictingPetAppointment = await queryRunner.manager
        .createQueryBuilder(Appointment, 'appointment')
        .where('appointment.pet_id = :petId', { petId: dto.petId })
        .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: [AppointmentStatus.CANCELADA],
        })
        .andWhere('appointment.start_date_time < :endDate', { endDate })
        .andWhere('appointment.end_date_time > :startDate', { startDate })
        .getOne();

      if (conflictingPetAppointment) {
        throw new ConflictException(
          'La mascota ya cuenta con una cita agendada en el rango de tiempo solicitado',
        );
      }

      // 5. Instanciar y guardar la cita dentro de la transacción atómica
      const appointment = queryRunner.manager.create(Appointment, {
        petId: pet.id,
        pet,
        clientId: client.id,
        client,
        veterinarianId: vet.id,
        veterinarian: vet,
        startDateTime: startDate,
        endDateTime: endDate,
        reason: dto.reason?.trim(),
        status: AppointmentStatus.PENDIENTE,
      });

      const savedAppointment = await queryRunner.manager.save(
        Appointment,
        appointment,
      );
      await queryRunner.commitTransaction();

      return this.toResponse(savedAppointment, vet, client, pet);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Consulta citas médicas aplicando filtros por rango de fechas, veterinario, mascota o estado.
   */
  async findAll(query?: AppointmentQueryDto): Promise<AppointmentResponseDto[]> {
    const qb = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.veterinarian', 'veterinarian')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.pet', 'pet')
      .orderBy('appointment.startDateTime', 'ASC');

    if (query?.startDate) {
      const start = new Date(query.startDate);
      if (!isNaN(start.getTime())) {
        qb.andWhere('appointment.startDateTime >= :startDate', {
          startDate: start,
        });
      }
    }

    if (query?.endDate) {
      const isDateOnly = query.endDate.length === 10;
      const end = isDateOnly
        ? new Date(`${query.endDate}T23:59:59.999Z`)
        : new Date(query.endDate);
      if (!isNaN(end.getTime())) {
        qb.andWhere('appointment.endDateTime <= :endDate', { endDate: end });
      }
    }

    if (query?.veterinarianId) {
      qb.andWhere('appointment.veterinarianId = :veterinarianId', {
        veterinarianId: query.veterinarianId,
      });
    }

    if (query?.petId) {
      qb.andWhere('appointment.petId = :petId', { petId: query.petId });
    }

    if (query?.clientId) {
      qb.andWhere('appointment.clientId = :clientId', {
        clientId: query.clientId,
      });
    }

    if (query?.status) {
      qb.andWhere('appointment.status = :status', { status: query.status });
    }

    const appointments = await qb.getMany();
    return appointments.map((apt) =>
      this.toResponse(apt, apt.veterinarian, apt.client, apt.pet),
    );
  }

  /**
   * Obtiene una cita por su identificador único (UUID).
   */
  async findOne(id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['veterinarian', 'client', 'pet'],
    });

    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    return this.toResponse(
      appointment,
      appointment.veterinarian,
      appointment.client,
      appointment.pet,
    );
  }

  /**
   * Actualiza el estado de una cita médica validando transiciones permitidas.
   */
  async updateStatus(
    id: string,
    dto: UpdateAppointmentStatusDto,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['veterinarian', 'client', 'pet'],
    });

    if (!appointment) {
      throw new NotFoundException(`Cita con ID ${id} no encontrada`);
    }

    if (appointment.status === dto.status) {
      return this.toResponse(
        appointment,
        appointment.veterinarian,
        appointment.client,
        appointment.pet,
      );
    }

    if (
      appointment.status === AppointmentStatus.CANCELADA &&
      dto.status !== AppointmentStatus.CANCELADA
    ) {
      throw new BadRequestException(
        'No se puede modificar el estado de una cita que ya fue cancelada',
      );
    }

    if (
      appointment.status === AppointmentStatus.ATENDIDA &&
      dto.status !== AppointmentStatus.ATENDIDA
    ) {
      throw new BadRequestException(
        'No se puede modificar el estado de una cita que ya fue atendida',
      );
    }

    appointment.status = dto.status;
    const updated = await this.appointmentsRepository.save(appointment);

    return this.toResponse(
      updated,
      updated.veterinarian || appointment.veterinarian,
      updated.client || appointment.client,
      updated.pet || appointment.pet,
    );
  }

  /**
   * Cancela una cita médica (cambio de estado a CANCELADA garantizando inmutabilidad histórica).
   */
  async cancel(id: string): Promise<AppointmentResponseDto> {
    return this.updateStatus(id, { status: AppointmentStatus.CANCELADA });
  }

  /**
   * Consulta la disponibilidad horaria de un veterinario para una fecha específica.
   */
  async getAvailability(
    query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    const vet = await this.usersRepository.findOne({
      where: { id: query.veterinarianId },
    });

    if (!vet) {
      throw new NotFoundException(
        `Veterinario con ID ${query.veterinarianId} no encontrado`,
      );
    }

    const dateStr = query.date.trim().substring(0, 10);
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    if (isNaN(startOfDay.getTime())) {
      throw new BadRequestException(
        'Formato de fecha inválido. Se espera YYYY-MM-DD',
      );
    }

    // Consultar citas no canceladas en el día
    const appointments = await this.appointmentsRepository
      .createQueryBuilder('appointment')
      .where('appointment.veterinarian_id = :vetId', {
        vetId: query.veterinarianId,
      })
      .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [AppointmentStatus.CANCELADA],
      })
      .andWhere('appointment.start_date_time >= :startOfDay', { startOfDay })
      .andWhere('appointment.start_date_time <= :endOfDay', { endOfDay })
      .orderBy('appointment.start_date_time', 'ASC')
      .getMany();

    const startHour = 8;
    const endHour = 18;
    const slotDurationMinutes = 30;

    const availableSlots: TimeSlotDto[] = [];
    const availableTimeSlots: string[] = [];

    const totalMinutes = (endHour - startHour) * 60;
    const numSlots = totalMinutes / slotDurationMinutes;

    for (let i = 0; i < numSlots; i++) {
      const slotStartMinutes = startHour * 60 + i * slotDurationMinutes;
      const slotEndMinutes = slotStartMinutes + slotDurationMinutes;

      const startH = Math.floor(slotStartMinutes / 60)
        .toString()
        .padStart(2, '0');
      const startM = (slotStartMinutes % 60).toString().padStart(2, '0');
      const endH = Math.floor(slotEndMinutes / 60)
        .toString()
        .padStart(2, '0');
      const endM = (slotEndMinutes % 60).toString().padStart(2, '0');

      const slotStart = new Date(`${dateStr}T${startH}:${startM}:00.000Z`);
      const slotEnd = new Date(`${dateStr}T${endH}:${endM}:00.000Z`);

      // Existe solapamiento si: slotStart < aptEnd Y slotEnd > aptStart
      const isOccupied = appointments.some((apt) => {
        const aptStart = new Date(apt.startDateTime).getTime();
        const aptEnd = new Date(apt.endDateTime).getTime();
        return slotStart.getTime() < aptEnd && slotEnd.getTime() > aptStart;
      });

      const isAvailable = !isOccupied;

      availableSlots.push({
        startDateTime: slotStart.toISOString(),
        endDateTime: slotEnd.toISOString(),
        available: isAvailable,
      });

      if (isAvailable) {
        availableTimeSlots.push(`${startH}:${startM} - ${endH}:${endM}`);
      }
    }

    const bookedAppointments: BookedAppointmentSummaryDto[] = appointments.map(
      (apt) => ({
        id: apt.id,
        startDateTime: new Date(apt.startDateTime).toISOString(),
        endDateTime: new Date(apt.endDateTime).toISOString(),
        status: apt.status,
      }),
    );

    return {
      veterinarianId: vet.id,
      veterinarianName: vet.fullName,
      date: dateStr,
      workingHours: {
        start: '08:00',
        end: '18:00',
      },
      slotDurationMinutes,
      availableSlots,
      availableTimeSlots,
      bookedAppointments,
    };
  }

  private toResponse(
    appointment: Appointment,
    vet?: User,
    client?: Client,
    pet?: Pet,
  ): AppointmentResponseDto {
    return {
      id: appointment.id,
      status: appointment.status,
      startDateTime: new Date(appointment.startDateTime).toISOString(),
      endDateTime: new Date(appointment.endDateTime).toISOString(),
      veterinarian: {
        id: vet?.id || appointment.veterinarianId,
        fullName: vet?.fullName || 'Veterinario',
      },
      client: {
        id: client?.id || appointment.clientId,
        fullName: client?.fullName || 'Cliente',
      },
      pet: pet
        ? {
            id: pet.id,
            name: pet.name,
            uniqueCode: pet.uniqueCode,
          }
        : undefined,
      reason: appointment.reason,
      createdAt: appointment.createdAt
        ? new Date(appointment.createdAt).toISOString()
        : undefined,
      updatedAt: appointment.updatedAt
        ? new Date(appointment.updatedAt).toISOString()
        : undefined,
    };
  }
}
