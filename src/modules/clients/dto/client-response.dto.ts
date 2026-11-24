import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: '1088000111' })
  identification: string;

  @ApiProperty({ example: 'user ejemplo' })
  fullName: string;

  @ApiProperty({ example: '3001234567' })
  phone: string;

  @ApiProperty({ example: 'userejemplo@huellas.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Calle Ejemplo 123' })
  address?: string;

  @ApiPropertyOptional({ example: '2026-11-23T19:00:00.000Z' })
  createdAt?: Date;
}
