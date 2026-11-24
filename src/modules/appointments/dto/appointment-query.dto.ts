import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class AppointmentQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial para filtrar citas (formato YYYY-MM-DD o ISO 8601)',
    example: '2026-10-01',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'startDate debe ser una fecha válida (YYYY-MM-DD o ISO 8601)' },
  )
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha final para filtrar citas (formato YYYY-MM-DD o ISO 8601)',
    example: '2026-10-31',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'endDate debe ser una fecha válida (YYYY-MM-DD o ISO 8601)' },
  )
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por UUID del veterinario asignado',
    example: 'u0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'veterinarianId debe ser un UUID v4 válido' })
  veterinarianId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por UUID de la mascota',
    example: 'b0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'petId debe ser un UUID v4 válido' })
  petId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por UUID del propietario',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'clientId debe ser un UUID v4 válido' })
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de la cita',
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDIENTE,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus, {
    message:
      'El estado debe ser uno de los siguientes: PENDIENTE, CONFIRMADA, ATENDIDA, CANCELADA, NO_ASISTIDA',
  })
  status?: AppointmentStatus;
}
