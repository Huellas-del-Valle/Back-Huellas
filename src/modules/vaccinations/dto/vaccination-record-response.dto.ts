import { ApiProperty } from '@nestjs/swagger';

export class VaccinationRecordResponseDto {
  @ApiProperty({
    description: 'Identificador único (UUID) del registro de vacunación',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  id: string;

  @ApiProperty({
    description: 'Identificador único (UUID) de la mascota asociada',
    example: 'a123f1ee-6c54-4b01-90e6-d701748f0899',
  })
  petId: string;

  @ApiProperty({
    description: 'Tipo de tratamiento (ej. VACUNA, DESPARASITACION)',
    example: 'VACUNA',
  })
  type: string;

  @ApiProperty({
    description: 'Nombre del biológico o tratamiento aplicado',
    example: 'Vacuna Antirrábica Ejemplo',
  })
  name: string;

  @ApiProperty({
    description: 'Número de lote del producto aplicado',
    example: 'LOTE-9988',
  })
  batchNumber: string;

  @ApiProperty({
    description: 'Fecha de aplicación del biológico (YYYY-MM-DD)',
    example: '2026-10-21',
  })
  applicationDate: string;

  @ApiProperty({
    description: 'Fecha límite del próximo refuerzo (YYYY-MM-DD)',
    example: '2027-10-21',
  })
  nextDueDate: string;

  @ApiProperty({
    description: 'Indica si ya se despachó la notificación de recordatorio',
    example: false,
  })
  notified: boolean;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2026-10-21T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2026-10-21T10:00:00.000Z',
  })
  updatedAt: Date;
}
