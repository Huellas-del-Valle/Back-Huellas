import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVaccinationDto {
  @ApiProperty({
    description: 'Tipo de tratamiento (ej. VACUNA, DESPARASITACION)',
    example: 'VACUNA',
  })
  @IsNotEmpty({ message: 'El tipo es obligatorio' })
  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El tipo no puede exceder 50 caracteres' })
  type: string;

  @ApiProperty({
    description: 'Nombre del biológico o tratamiento aplicado',
    example: 'Vacuna Antirrábica Ejemplo',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Número de lote del producto aplicado',
    example: 'LOTE-9988',
  })
  @IsNotEmpty({ message: 'El número de lote es obligatorio' })
  @IsString({ message: 'El número de lote debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El número de lote no puede exceder 100 caracteres' })
  batchNumber: string;

  @ApiProperty({
    description: 'Fecha de aplicación del biológico (formato YYYY-MM-DD)',
    example: '2026-10-21',
  })
  @IsNotEmpty({ message: 'La fecha de aplicación es obligatoria' })
  @IsDateString({}, { message: 'La fecha de aplicación debe tener formato YYYY-MM-DD' })
  applicationDate: string;

  @ApiProperty({
    description: 'Fecha límite del próximo refuerzo (formato YYYY-MM-DD)',
    example: '2027-10-21',
  })
  @IsNotEmpty({ message: 'La fecha del próximo refuerzo es obligatoria' })
  @IsDateString({}, { message: 'La fecha de próximo refuerzo debe tener formato YYYY-MM-DD' })
  nextDueDate: string;
}
