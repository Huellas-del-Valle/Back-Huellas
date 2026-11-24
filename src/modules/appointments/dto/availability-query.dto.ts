import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({
    description: 'UUID del veterinario a consultar',
    example: 'u0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'El veterinarianId es obligatorio' })
  @IsUUID('4', { message: 'El veterinarianId debe ser un UUID v4 válido' })
  veterinarianId: string;

  @ApiProperty({
    description: 'Fecha a consultar en formato YYYY-MM-DD',
    example: '2026-10-22',
  })
  @IsNotEmpty({ message: 'La fecha date es obligatoria' })
  @IsDateString(
    {},
    { message: 'date debe ser una fecha válida con formato YYYY-MM-DD' },
  )
  date: string;
}
