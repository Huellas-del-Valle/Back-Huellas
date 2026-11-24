import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la cita',
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMADA,
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(AppointmentStatus, {
    message:
      'El estado debe ser uno de los siguientes: PENDIENTE, CONFIRMADA, ATENDIDA, CANCELADA, NO_ASISTIDA',
  })
  status: AppointmentStatus;
}
