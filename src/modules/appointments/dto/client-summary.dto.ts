import { ApiProperty } from '@nestjs/swagger';

export class ClientSummaryDto {
  @ApiProperty({
    description: 'UUID del cliente propietario',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'user ejemplo',
  })
  fullName: string;
}
