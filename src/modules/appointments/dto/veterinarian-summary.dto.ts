import { ApiProperty } from '@nestjs/swagger';

export class VeterinarianSummaryDto {
  @ApiProperty({
    description: 'UUID del veterinario asignado',
    example: 'u0000000-0000-0000-0000-000000000001',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del veterinario',
    example: 'user ejemplo',
  })
  fullName: string;
}
