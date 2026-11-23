import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Estado general del servicio' })
  status!: string;

  @ApiProperty({ example: 'connected', description: 'Estado de conexión con la base de datos MySQL' })
  database!: string;

  @ApiProperty({ example: '2026-10-21T08:00:00Z', description: 'Marca de tiempo en formato ISO' })
  timestamp!: string;
}
