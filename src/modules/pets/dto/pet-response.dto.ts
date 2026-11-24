import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientSummaryDto } from './client-summary.dto';
import { PetGender } from '../enums/pet-gender.enum';

export class PetResponseDto {
  @ApiProperty({
    description: 'Identificador único (UUID) de la mascota',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id: string;

  @ApiProperty({
    description: 'Código unívoco del paciente',
    example: 'HUV-2026-0001',
  })
  uniqueCode: string;

  @ApiProperty({
    description: 'Nombre de la mascota',
    example: 'Mascota ejemplo',
  })
  name: string;

  @ApiProperty({
    description: 'Especie del paciente',
    example: 'CANINO',
  })
  species: string;

  @ApiProperty({
    description: 'Raza de la mascota',
    example: 'Labrador',
  })
  breed: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento de la mascota',
    example: '2024-01-15',
  })
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Género de la mascota',
    enum: PetGender,
    example: PetGender.MACHO,
  })
  gender?: string;

  @ApiProperty({
    description: 'Datos del cliente propietario',
    type: () => ClientSummaryDto,
  })
  client: ClientSummaryDto;

  @ApiPropertyOptional({
    description: 'Fecha de registro',
    example: '2026-11-23T19:00:00.000Z',
  })
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de última actualización',
    example: '2026-11-23T19:00:00.000Z',
  })
  updatedAt?: Date;
}
