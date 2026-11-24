import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { PetResponseDto } from './dto/pet-response.dto';

@ApiTags('pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una nueva mascota asociada a un cliente',
    description:
      'Crea una entidad Pet con generación unívoca de código de paciente (HUV-YYYY-XXXX) o validación del provisto, y vinculación estricta con el cliente.',
  })
  @ApiCreatedResponse({
    description: 'Mascota creada exitosamente',
    type: PetResponseDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe una mascota registrada con el código provisto',
  })
  @ApiNotFoundResponse({
    description: 'El cliente propietario especificado no existe',
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o formato de código incorrecto',
  })
  create(@Body() dto: CreatePetDto): Promise<PetResponseDto> {
    return this.petsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar una mascota por su ID (UUID)',
    description:
      'Retorna los datos clínicos y de filiación de la mascota incluyendo el resumen de su propietario.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la mascota' })
  @ApiOkResponse({
    description: 'Mascota encontrada exitosamente',
    type: PetResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Mascota no encontrada' })
  @ApiBadRequestResponse({ description: 'ID no es un UUID válido' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<PetResponseDto> {
    return this.petsService.findOne(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas las mascotas registradas',
    description: 'Retorna el listado completo de mascotas con sus respectivos propietarios.',
  })
  @ApiOkResponse({
    description: 'Listado de mascotas',
    type: [PetResponseDto],
  })
  findAll(): Promise<PetResponseDto[]> {
    return this.petsService.findAll();
  }
}
