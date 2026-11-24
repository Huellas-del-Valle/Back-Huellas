import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'Número de documento o cédula (entre 5 y 20 dígitos numéricos)',
    example: '1088000111',
  })
  @IsString({ message: 'La identificación debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número de identificación es obligatorio' })
  @Matches(/^[0-9]{5,20}$/, {
    message: 'El documento de identificación debe tener un formato válido (entre 5 y 20 dígitos numéricos)',
  })
  identification: string;

  @ApiProperty({
    description: 'Nombre completo del cliente / propietario',
    example: 'user ejemplo',
  })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @MaxLength(150, { message: 'El nombre completo no puede exceder 150 caracteres' })
  fullName: string;

  @ApiProperty({
    description: 'Número telefónico de contacto',
    example: '3001234567',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^(\+57)?[0-9]{7,15}$/, {
    message: 'El teléfono debe tener un formato válido (entre 7 y 15 dígitos numéricos)',
  })
  phone: string;

  @ApiProperty({
    description: 'Correo electrónico de contacto',
    example: 'userejemplo@huellas.com',
  })
  @IsEmail({}, { message: 'El formato de correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @MaxLength(255, { message: 'El correo electrónico no puede exceder 255 caracteres' })
  email: string;

  @ApiPropertyOptional({
    description: 'Dirección física de residencia',
    example: 'Calle Ejemplo 123',
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
  address?: string;
}
