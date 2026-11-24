import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Pet } from '../pets/entities/pet.entity';
import { MailService } from '../mail/mail.service';
import { VaccinationRecord } from './entities/vaccination-record.entity';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { VaccinationRecordResponseDto } from './dto/vaccination-record-response.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';

@Injectable()
export class VaccinationsService {
  private readonly logger = new Logger(VaccinationsService.name);

  constructor(
    @InjectRepository(VaccinationRecord)
    private readonly vaccinationRepository: Repository<VaccinationRecord>,
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Registra una nueva aplicación de vacuna o desparasitación asociada a una mascota
   */
  async create(
    petId: string,
    dto: CreateVaccinationDto,
  ): Promise<VaccinationRecordResponseDto> {
    const pet = await this.petRepository.findOne({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    const vaccinationRecord = this.vaccinationRepository.create({
      petId,
      type: dto.type.trim(),
      name: dto.name.trim(),
      batchNumber: dto.batchNumber.trim(),
      applicationDate: dto.applicationDate,
      nextDueDate: dto.nextDueDate,
      notified: false,
    });

    const saved = await this.vaccinationRepository.save(vaccinationRecord);
    return this.mapToResponseDto(saved);
  }

  /**
   * Consulta el histórico de aplicaciones de vacunas o desparasitaciones de una mascota
   */
  async findByPetId(petId: string): Promise<VaccinationRecordResponseDto[]> {
    const pet = await this.petRepository.findOne({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    const records = await this.vaccinationRepository.find({
      where: { petId },
      order: {
        applicationDate: 'DESC',
        createdAt: 'DESC',
      },
    });

    return records.map((record) => this.mapToResponseDto(record));
  }

  /**
   * Reenvío o envío manual de alerta de recordatorio al propietario
   */
  async sendManualReminder(
    petId: string,
    id: string,
  ): Promise<ReminderResponseDto> {
    const pet = await this.petRepository.findOne({
      where: { id: petId },
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${petId} no encontrada`);
    }

    const record = await this.vaccinationRepository.findOne({
      where: { id, petId },
      relations: ['pet', 'pet.client'],
    });

    if (!record) {
      throw new NotFoundException(
        'Registro de vacunación no encontrado para la mascota especificada',
      );
    }

    const client = record.pet?.client;
    if (!client || !client.email) {
      throw new BadRequestException(
        'El propietario de la mascota no tiene un correo electrónico registrado',
      );
    }

    const sentAt = new Date().toISOString();

    try {
      await this.mailService.sendVaccinationReminder({
        to: client.email,
        ownerName: client.fullName,
        petName: record.pet.name,
        petCode: record.pet.uniqueCode,
        species: record.pet.species,
        vaccinationType: record.type,
        vaccinationName: record.name,
        batchNumber: record.batchNumber,
        applicationDate: record.applicationDate,
        nextDueDate: record.nextDueDate,
      });

      record.notified = true;
      await this.vaccinationRepository.save(record);

      this.logAudit('EXITOSO', {
        event: 'VACCINATION_REMINDER_NOTIFICATION',
        trigger: 'MANUAL',
        vaccinationId: record.id,
        vaccinationName: record.name,
        vaccinationType: record.type,
        petId: record.pet.id,
        petName: record.pet.name,
        petCode: record.pet.uniqueCode,
        ownerId: client.id,
        ownerName: client.fullName,
        recipientEmail: client.email,
        nextDueDate: record.nextDueDate,
      });

      return {
        message: `Recordatorio enviado satisfactoriamente al correo ${client.email}`,
        recipient: client.email,
        petName: record.pet.name,
        sentAt,
      };
    } catch (error: any) {
      this.logAudit('FALLIDO', {
        event: 'VACCINATION_REMINDER_NOTIFICATION',
        trigger: 'MANUAL',
        vaccinationId: record.id,
        vaccinationName: record.name,
        vaccinationType: record.type,
        petId: record.pet.id,
        petName: record.pet.name,
        petCode: record.pet.uniqueCode,
        ownerId: client.id,
        ownerName: client.fullName,
        recipientEmail: client.email,
        nextDueDate: record.nextDueDate,
        error: error?.message || String(error),
      });

      throw error;
    }
  }

  /**
   * Cálculo de fecha límite (YYYY-MM-DD) para evaluación de refuerzos próximos a N días
   */
  calculateDueDateThreshold(
    referenceDate: Date = new Date(),
    daysAhead = 3,
  ): string {
    const target = new Date(referenceDate);
    target.setDate(target.getDate() + daysAhead);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Determina si una fecha de refuerzo califica dentro del umbral de días respecto a una fecha base
   */
  isRecordDueForReminder(
    nextDueDate: string,
    referenceDate: Date = new Date(),
    daysThreshold = 3,
  ): boolean {
    const thresholdDateString = this.calculateDueDateThreshold(
      referenceDate,
      daysThreshold,
    );
    return nextDueDate <= thresholdDateString;
  }

  /**
   * Procesa de forma masiva y no bloqueante los refuerzos próximos a 3 días o menos
   * Utilizado por el Cron Job diario para evaluar y despachar correos automáticos.
   */
  async processUpcomingReminders(
    referenceDate: Date = new Date(),
    daysThreshold = 3,
  ): Promise<{ totalEvaluated: number; sent: number; failed: number }> {
    const thresholdDate = this.calculateDueDateThreshold(
      referenceDate,
      daysThreshold,
    );

    this.logger.log(
      `Consultando refuerzos pendientes con fecha límite <= ${thresholdDate} (Umbral: ${daysThreshold} días)`,
    );

    const pendingRecords = await this.vaccinationRepository.find({
      where: {
        notified: false,
        nextDueDate: LessThanOrEqual(thresholdDate),
      },
      relations: ['pet', 'pet.client'],
    });

    let sent = 0;
    let failed = 0;

    for (const record of pendingRecords) {
      const pet = record.pet;
      const client = pet?.client;

      if (!client || !client.email) {
        this.logger.warn(
          `Registro ${record.id} ignorado: Mascota ${pet?.name || 'desconocida'} no tiene propietario con email válido`,
        );
        this.logAudit('FALLIDO', {
          event: 'VACCINATION_REMINDER_NOTIFICATION',
          trigger: 'CRON_JOB',
          vaccinationId: record.id,
          vaccinationName: record.name,
          vaccinationType: record.type,
          petId: pet?.id || 'N/A',
          petName: pet?.name || 'N/A',
          petCode: pet?.uniqueCode || 'N/A',
          ownerId: client?.id,
          ownerName: client?.fullName,
          recipientEmail: client?.email,
          nextDueDate: record.nextDueDate,
          error: 'Propietario o email no disponible',
        });
        failed++;
        continue;
      }

      try {
        await this.mailService.sendVaccinationReminder({
          to: client.email,
          ownerName: client.fullName,
          petName: pet.name,
          petCode: pet.uniqueCode,
          species: pet.species,
          vaccinationType: record.type,
          vaccinationName: record.name,
          batchNumber: record.batchNumber,
          applicationDate: record.applicationDate,
          nextDueDate: record.nextDueDate,
        });

        record.notified = true;
        await this.vaccinationRepository.save(record);

        this.logAudit('EXITOSO', {
          event: 'VACCINATION_REMINDER_NOTIFICATION',
          trigger: 'CRON_JOB',
          vaccinationId: record.id,
          vaccinationName: record.name,
          vaccinationType: record.type,
          petId: pet.id,
          petName: pet.name,
          petCode: pet.uniqueCode,
          ownerId: client.id,
          ownerName: client.fullName,
          recipientEmail: client.email,
          nextDueDate: record.nextDueDate,
        });

        sent++;
      } catch (error: any) {
        this.logger.error(
          `Fallo al enviar notificación automática para registro ${record.id}: ${error?.message || error}`,
        );

        this.logAudit('FALLIDO', {
          event: 'VACCINATION_REMINDER_NOTIFICATION',
          trigger: 'CRON_JOB',
          vaccinationId: record.id,
          vaccinationName: record.name,
          vaccinationType: record.type,
          petId: pet.id,
          petName: pet.name,
          petCode: pet.uniqueCode,
          ownerId: client.id,
          ownerName: client.fullName,
          recipientEmail: client.email,
          nextDueDate: record.nextDueDate,
          error: error?.message || String(error),
        });

        failed++;
      }
    }

    return {
      totalEvaluated: pendingRecords.length,
      sent,
      failed,
    };
  }

  /**
   * Registro estructurado en el log de auditoría (RNF-15: Trazabilidad)
   */
  private logAudit(
    status: 'EXITOSO' | 'FALLIDO',
    details: {
      event: string;
      trigger: 'CRON_JOB' | 'MANUAL';
      vaccinationId: string;
      vaccinationName: string;
      vaccinationType: string;
      petId: string;
      petName: string;
      petCode: string;
      ownerId?: string;
      ownerName?: string;
      recipientEmail?: string;
      nextDueDate: string;
      error?: string;
    },
  ): void {
    const auditLog = {
      timestamp: new Date().toISOString(),
      status,
      ...details,
    };

    console.log(`[AUDIT] [${status}]`, auditLog);
    this.logger.log(
      `[AUDIT] Notificación ${status} | Trigger: ${details.trigger} | Mascota: ${details.petName} | Destinatario: ${details.recipientEmail || 'N/A'} | Refuerzo: ${details.nextDueDate}`,
    );
  }

  private mapToResponseDto(
    entity: VaccinationRecord,
  ): VaccinationRecordResponseDto {
    return {
      id: entity.id,
      petId: entity.petId,
      type: entity.type,
      name: entity.name,
      batchNumber: entity.batchNumber,
      applicationDate: entity.applicationDate,
      nextDueDate: entity.nextDueDate,
      notified: entity.notified,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
