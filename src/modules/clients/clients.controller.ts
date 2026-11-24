import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { SearchClientQueryDto } from './dto/search-client-query.dto';
import { ClientResponseDto } from './dto/client-response.dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Búsqueda indexada de clientes por cédula o teléfono',
    description:
      'Realiza una búsqueda optimizada (< 1s) utilizando los índices de MySQL sobre los campos identification y phone.',
  })
  @ApiQuery({
    name: 'query',
    type: String,
    required: true,
    description: 'Criterio de búsqueda por cédula o teléfono',
    example: '1088',
  })
  @ApiOkResponse({
    description: 'Clientes encontrados',
    type: [ClientResponseDto],
  })
  @ApiBadRequestResponse({ description: 'Parámetro de búsqueda inválido' })
  search(@Query() queryDto: SearchClientQueryDto): Promise<ClientResponseDto[]> {
    return this.clientsService.search(queryDto.query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiCreatedResponse({
    description: 'Cliente creado exitosamente',
    type: ClientResponseDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe un cliente con este número de identificación',
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  create(@Body() dto: CreateClientDto): Promise<ClientResponseDto> {
    return this.clientsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes con paginación' })
  @ApiOkResponse({ description: 'Listado paginado de clientes' })
  findAll(@Query() query: ListClientsQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por su ID (UUID)' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiOkResponse({
    description: 'Cliente encontrado',
    type: ClientResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiBadRequestResponse({ description: 'ID no es un UUID válido' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ClientResponseDto> {
    return this.clientsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un cliente por su ID (UUID)' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiOkResponse({
    description: 'Cliente actualizado exitosamente',
    type: ClientResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiConflictResponse({
    description: 'Conflicto por número de documento duplicado',
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos o ID no válido' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un cliente por su ID (UUID)' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiNoContentResponse({ description: 'Cliente eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Cliente no encontrado' })
  @ApiBadRequestResponse({ description: 'ID no es un UUID válido' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.clientsService.remove(id);
  }
}
