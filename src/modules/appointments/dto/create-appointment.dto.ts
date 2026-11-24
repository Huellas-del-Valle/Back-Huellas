import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'UUID de la mascota',
    example: 'b0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'El petId es obligatorio' })
  @IsUUID('4', { message: 'El petId debe ser un UUID v4 válido' })
  petId: string;

  @ApiProperty({
    description: 'UUID del veterinario asignado',
    example: 'u0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'El veterinarianId es obligatorio' })
  @IsUUID('4', { message: 'El veterinarianId debe ser un UUID v4 válido' })
  veterinarianId: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la cita en formato ISO 8601',
    example: '2026-10-22T09:00:00Z',
  })
  @IsNotEmpty({ message: 'startDateTime es obligatoria' })
  @IsDateString(
    {},
    { message: 'startDateTime debe ser una fecha y hora ISO 8601 válida' },
  )
  startDateTime: string;

  @ApiProperty({
    description: 'Fecha y hora de finalización de la cita en formato ISO 8601',
    example: '2026-10-22T09:30:00Z',
  })
  @IsNotEmpty({ message: 'endDateTime es obligatoria' })
  @IsDateString(
    {},
    { message: 'endDateTime debe ser una fecha y hora ISO 8601 válida' },
  )
  endDateTime: string;

  @ApiPropertyOptional({
    description: 'Motivo de la consulta médica',
    example: 'Consulta médica general',
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El motivo no puede exceder 255 caracteres' })
  reason?: string;
}
