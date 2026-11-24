import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PetGender } from '../enums/pet-gender.enum';

export class CreatePetDto {
  @ApiPropertyOptional({
    description:
      'Código unívoco del paciente. Si se omite, se autogenera con formato HUV-YYYY-XXXX.',
    example: 'HUV-2026-0001',
  })
  @IsOptional()
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @Matches(/^HUV-\d{4}-\d{4,5}$/, {
    message:
      'El código de la mascota debe tener el formato HUV-YYYY-XXXX (ej: HUV-2026-0001)',
  })
  code?: string;

  @ApiPropertyOptional({
    description:
      'Alias alternativo para el código unívoco del paciente (opcional).',
    example: 'HUV-2026-0001',
  })
  @IsOptional()
  @IsString({ message: 'El uniqueCode debe ser una cadena de texto' })
  @Matches(/^HUV-\d{4}-\d{4,5}$/, {
    message:
      'El código de la mascota debe tener el formato HUV-YYYY-XXXX (ej: HUV-2026-0001)',
  })
  uniqueCode?: string;

  @ApiProperty({
    description: 'Nombre de la mascota',
    example: 'Mascota ejemplo',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Especie del paciente (ej: CANINO, FELINO, AVE, etc.)',
    example: 'CANINO',
  })
  @IsNotEmpty({ message: 'La especie es obligatoria' })
  @IsString({ message: 'La especie debe ser una cadena de texto' })
  @MaxLength(50, { message: 'La especie no puede exceder 50 caracteres' })
  species: string;

  @ApiProperty({
    description: 'Raza de la mascota',
    example: 'Labrador',
  })
  @IsNotEmpty({ message: 'La raza es obligatoria' })
  @IsString({ message: 'La raza debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La raza no puede exceder 100 caracteres' })
  breed: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento de la mascota (formato YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'La fecha de nacimiento debe tener un formato de fecha válido (YYYY-MM-DD)',
    },
  )
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Género de la mascota',
    enum: PetGender,
    example: PetGender.MACHO,
  })
  @IsOptional()
  @IsEnum(PetGender, {
    message: 'El género debe ser MACHO, HEMBRA o DESCONOCIDO',
  })
  gender?: PetGender;

  @ApiProperty({
    description: 'Identificador único (UUID) del propietario',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @IsNotEmpty({ message: 'El clientId es obligatorio' })
  @IsUUID('4', { message: 'El clientId debe ser un UUID v4 válido' })
  clientId: string;
}
