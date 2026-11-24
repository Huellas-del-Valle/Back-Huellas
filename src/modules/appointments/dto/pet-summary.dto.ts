import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PetSummaryDto {
  @ApiProperty({
    description: 'UUID de la mascota',
    example: 'b0000000-0000-0000-0000-000000000001',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre de la mascota',
    example: 'Mascota ejemplo',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Código unívoco del paciente',
    example: 'HUV-2026-0001',
  })
  uniqueCode?: string;
}
