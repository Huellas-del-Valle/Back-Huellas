import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { VeterinarianSummaryDto } from './veterinarian-summary.dto';
import { ClientSummaryDto } from './client-summary.dto';
import { PetSummaryDto } from './pet-summary.dto';

export class AppointmentResponseDto {
  @ApiProperty({
    description: 'Identificador único (UUID) de la cita',
    example: 'uuid-v4-appointment',
  })
  id: string;

  @ApiProperty({
    description: 'Estado de la cita',
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDIENTE,
  })
  status: AppointmentStatus;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la cita (formato ISO 8601)',
    example: '2026-10-22T09:00:00Z',
  })
  startDateTime: string;

  @ApiProperty({
    description: 'Fecha y hora de finalización de la cita (formato ISO 8601)',
    example: '2026-10-22T09:30:00Z',
  })
  endDateTime: string;

  @ApiProperty({
    description: 'Datos del veterinario asignado',
    type: VeterinarianSummaryDto,
  })
  veterinarian: VeterinarianSummaryDto;

  @ApiProperty({
    description: 'Datos del cliente propietario',
    type: ClientSummaryDto,
  })
  client: ClientSummaryDto;

  @ApiPropertyOptional({
    description: 'Datos de la mascota asociada',
    type: PetSummaryDto,
  })
  pet?: PetSummaryDto;

  @ApiPropertyOptional({
    description: 'Motivo de la cita médica',
    example: 'Consulta médica general',
  })
  reason?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de creación de la cita',
    example: '2026-10-22T08:00:00.000Z',
  })
  createdAt?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de última actualización de la cita',
    example: '2026-10-22T08:00:00.000Z',
  })
  updatedAt?: string;
}
