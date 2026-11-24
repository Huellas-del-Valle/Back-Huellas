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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { VaccinationsService } from './vaccinations.service';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { VaccinationRecordResponseDto } from './dto/vaccination-record-response.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';

@ApiTags('vaccinations')
@Controller('pets/:petId/vaccinations')
export class VaccinationsController {
  constructor(private readonly vaccinationsService: VaccinationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar aplicación de vacuna o desparasitación',
    description:
      'Registra un nuevo plan de vacunación o desparasitación para la mascota especificada (RF-16: Control de vacunación).',
  })
  @ApiParam({
    name: 'petId',
    description: 'UUID de la mascota a la que se le aplica el biológico',
    example: 'a123f1ee-6c54-4b01-90e6-d701748f0899',
  })
  @ApiCreatedResponse({
    description: 'Registro de vacunación o desparasitación creado exitosamente',
    type: VaccinationRecordResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'La mascota especificada no existe',
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o formato de fecha incorrecto',
  })
  create(
    @Param('petId', new ParseUUIDPipe({ version: '4' })) petId: string,
    @Body() dto: CreateVaccinationDto,
  ): Promise<VaccinationRecordResponseDto> {
    return this.vaccinationsService.create(petId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Consultar el esquema de vacunación y desparasitación de una mascota',
    description:
      'Retorna el historial completo de biológicos aplicados a la mascota con sus fechas de próximo refuerzo.',
  })
  @ApiParam({
    name: 'petId',
    description: 'UUID de la mascota a consultar',
    example: 'a123f1ee-6c54-4b01-90e6-d701748f0899',
  })
  @ApiOkResponse({
    description: 'Listado del esquema de inmunización de la mascota',
    type: [VaccinationRecordResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'La mascota especificada no existe',
  })
  @ApiBadRequestResponse({
    description: 'El ID de la mascota no es un UUID válido',
  })
  findByPet(
    @Param('petId', new ParseUUIDPipe({ version: '4' })) petId: string,
  ): Promise<VaccinationRecordResponseDto[]> {
    return this.vaccinationsService.findByPetId(petId);
  }

  @Post(':id/send-reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenvío manual de alerta de recordatorio de refuerzo',
    description:
      'Despacha inmediatamente un correo electrónico al propietario con el recordatorio del próximo refuerzo de la mascota (RF-17: Recordatorios).',
  })
  @ApiParam({
    name: 'petId',
    description: 'UUID de la mascota',
    example: 'a123f1ee-6c54-4b01-90e6-d701748f0899',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del registro de vacunación',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @ApiOkResponse({
    description: 'Recordatorio enviado exitosamente al correo del propietario',
    type: ReminderResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'La mascota o el registro de vacunación no existen o no coinciden',
  })
  @ApiBadRequestResponse({
    description:
      'El propietario no posee un correo electrónico registrado o UUID inválido',
  })
  sendReminder(
    @Param('petId', new ParseUUIDPipe({ version: '4' })) petId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ReminderResponseDto> {
    return this.vaccinationsService.sendManualReminder(petId, id);
  }
}
