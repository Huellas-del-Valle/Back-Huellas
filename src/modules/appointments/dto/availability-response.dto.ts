import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class TimeSlotDto {
  @ApiProperty({
    description: 'Fecha y hora de inicio del bloque (ISO 8601)',
    example: '2026-10-22T08:00:00.000Z',
  })
  startDateTime: string;

  @ApiProperty({
    description: 'Fecha y hora de fin del bloque (ISO 8601)',
    example: '2026-10-22T08:30:00.000Z',
  })
  endDateTime: string;

  @ApiProperty({
    description: 'Indica si el bloque está disponible para agendamiento',
    example: true,
  })
  available: boolean;
}

export class BookedAppointmentSummaryDto {
  @ApiProperty({
    description: 'UUID de la cita agendada',
    example: 'uuid-v4-appointment',
  })
  id: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la cita (ISO 8601)',
    example: '2026-10-22T09:00:00.000Z',
  })
  startDateTime: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la cita (ISO 8601)',
    example: '2026-10-22T09:30:00.000Z',
  })
  endDateTime: string;

  @ApiProperty({
    description: 'Estado de la cita',
    enum: AppointmentStatus,
    example: AppointmentStatus.PENDIENTE,
  })
  status: AppointmentStatus;
}

export class WorkingHoursDto {
  @ApiProperty({ example: '08:00' })
  start: string;

  @ApiProperty({ example: '18:00' })
  end: string;
}

export class AvailabilityResponseDto {
  @ApiProperty({
    description: 'UUID del veterinario consultado',
    example: 'u0000000-0000-0000-0000-000000000001',
  })
  veterinarianId: string;

  @ApiProperty({
    description: 'Nombre completo del veterinario',
    example: 'user ejemplo',
  })
  veterinarianName: string;

  @ApiProperty({
    description: 'Fecha consultada (YYYY-MM-DD)',
    example: '2026-10-22',
  })
  date: string;

  @ApiProperty({
    description: 'Horario laboral configurado de la clínica',
    type: WorkingHoursDto,
  })
  workingHours: WorkingHoursDto;

  @ApiProperty({
    description: 'Duración estándar de cada turno en minutos',
    example: 30,
  })
  slotDurationMinutes: number;

  @ApiProperty({
    description: 'Detalle de disponibilidad por cada bloque horario',
    type: [TimeSlotDto],
  })
  availableSlots: TimeSlotDto[];

  @ApiProperty({
    description: 'Lista de rangos de texto con bloques disponibles',
    example: ['08:00 - 08:30', '08:30 - 09:00', '09:30 - 10:00'],
  })
  availableTimeSlots: string[];

  @ApiProperty({
    description: 'Citas reservadas para la fecha consultada',
    type: [BookedAppointmentSummaryDto],
  })
  bookedAppointments: BookedAppointmentSummaryDto[];
}
