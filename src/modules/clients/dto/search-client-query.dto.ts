import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchClientQueryDto {
  @ApiProperty({
    description: 'Término de búsqueda indexada por número de documento/cédula o teléfono',
    example: '1088',
  })
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El parámetro de búsqueda no puede estar vacío' })
  query: string;
}
