import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { AppointmentsService } from './appointments.service';
import {
  AppointmentQueryDto,
  AppointmentResponseDto,
  AvailabilityQueryDto,
  AvailabilityResponseDto,
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agendar una nueva cita médica',
    description:
      'Crea una cita validando transaccionalmente que el veterinario y la mascota no tengan solapamientos de turno.',
  })
  @ApiCreatedResponse({
    description: 'Cita médica agendada exitosamente',
    type: AppointmentResponseDto,
  })
  @ApiConflictResponse({
    description:
      'Conflicto de horario: el veterinario o la mascota ya tienen una cita en el rango solicitado (HTTP 409)',
  })
  @ApiNotFoundResponse({
    description: 'Veterinario, mascota o propietario no encontrado',
  })
  @ApiBadRequestResponse({
    description:
      'Datos de entrada inválidos o fechas con inconsistencia lógica (inicio posterior a fin)',
  })
  create(
    @Body() createDto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(createDto);
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Consultar disponibilidad horaria de un veterinario',
    description:
      'Retorna los bloques horarios de 30 minutos disponibles y ocupados para un veterinario en una fecha determinada.',
  })
  @ApiOkResponse({
    description: 'Disponibilidad horaria calculada',
    type: AvailabilityResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veterinario no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta inválidos',
  })
  getAvailability(
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    return this.appointmentsService.getAvailability(query);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar y filtrar citas médicas',
    description:
      'Retorna las citas registradas en el sistema con filtros opcionales por rango de fecha (startDate, endDate), veterinario, mascota o estado.',
  })
  @ApiOkResponse({
    description: 'Listado de citas médicas',
    type: [AppointmentResponseDto],
  })
  findAll(
    @Query() query: AppointmentQueryDto,
  ): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de una cita médica por UUID',
    description:
      'Retorna la información completa de una cita, incluyendo datos del veterinario, propietario y paciente.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiOkResponse({
    description: 'Cita encontrada',
    type: AppointmentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  @ApiBadRequestResponse({ description: 'ID no es un UUID válido' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar el estado de una cita médica',
    description:
      'Permite cambiar el estado de la cita (PENDIENTE, CONFIRMADA, ATENDIDA, CANCELADA, NO_ASISTIDA).',
  })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiOkResponse({
    description: 'Estado de la cita actualizado',
    type: AppointmentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  @ApiBadRequestResponse({
    description:
      'Estado inválido o transición no permitida (ej. cita ya cancelada o atendida)',
  })
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Cancelar una cita médica',
    description:
      'Realiza una cancelación lógica de la cita marcando su estado como CANCELADA, preservando la inmutabilidad histórica.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la cita a cancelar' })
  @ApiOkResponse({
    description: 'Cita médica cancelada',
    type: AppointmentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.cancel(id);
  }
}
