import { ApiProperty } from '@nestjs/swagger';

export class ReminderResponseDto {
  @ApiProperty({
    description: 'Mensaje descriptivo del resultado del envío',
    example:
      'Recordatorio enviado satisfactoriamente al correo userejemplo@huellas.com',
  })
  message: string;

  @ApiProperty({
    description: 'Dirección de correo electrónico del propietario receptor',
    example: 'userejemplo@huellas.com',
  })
  recipient: string;

  @ApiProperty({
    description: 'Nombre de la mascota vinculada al recordatorio',
    example: 'Mascota ejemplo',
  })
  petName: string;

  @ApiProperty({
    description: 'Fecha y hora (ISO 8601) en la que se despachó el recordatorio',
    example: '2026-10-21T07:00:00Z',
  })
  sentAt: string;
}
