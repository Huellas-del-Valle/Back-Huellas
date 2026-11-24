import { ApiProperty } from '@nestjs/swagger';

export class ClientSummaryDto {
  @ApiProperty({
    description: 'Identificador único (UUID) del propietario',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del propietario',
    example: 'user ejemplo',
  })
  fullName: string;
}
