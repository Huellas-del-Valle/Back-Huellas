import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  /**
   * Crea un nuevo cliente validando unicidad de identificación
   */
  async create(dto: CreateClientDto): Promise<ClientResponseDto> {
    const identification = dto.identification.trim();

    const existingClient = await this.clientsRepository.findOne({
      where: { identification },
    });

    if (existingClient) {
      throw new ConflictException(
        `Ya existe un cliente registrado con el número de documento ${identification}`,
      );
    }

    const client = this.clientsRepository.create({
      ...dto,
      identification,
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      email: dto.email.trim().toLowerCase(),
      address: dto.address?.trim(),
    });

    try {
      const saved = await this.clientsRepository.save(client);
      return this.toResponse(saved);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Duplicate entry') ||
          (error as { errno?: number }).errno === 1062)
      ) {
        throw new ConflictException(
          `Ya existe un cliente registrado con el número de documento ${identification}`,
        );
      }
      throw error;
    }
  }

  /**
   * Búsqueda indexada y rápida por cédula o teléfono (< 1s)
   * Utiliza los índices B-Tree de MySQL con búsqueda por prefijo
   */
  async search(query: string): Promise<ClientResponseDto[]> {
    const term = query?.trim();
    if (!term) {
      return [];
    }

    const clients = await this.clientsRepository
      .createQueryBuilder('client')
      .where('client.identification LIKE :prefix', { prefix: `${term}%` })
      .orWhere('client.phone LIKE :prefix', { prefix: `${term}%` })
      .orderBy('client.createdAt', 'DESC')
      .take(50)
      .getMany();

    return clients.map((client) => this.toResponse(client));
  }

  /**
   * Lista clientes con paginación
   */
  async findAll(query: ListClientsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const [clients, total] = await this.clientsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: clients.map((client) => this.toResponse(client)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene un cliente por su ID (UUID)
   */
  async findOne(id: string): Promise<ClientResponseDto> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return this.toResponse(client);
  }

  /**
   * Actualiza un cliente validando unicidad de documento si cambia
   */
  async update(id: string, dto: UpdateClientDto): Promise<ClientResponseDto> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    if (
      dto.identification &&
      dto.identification.trim() !== client.identification
    ) {
      const newIdentification = dto.identification.trim();
      const duplicate = await this.clientsRepository.findOne({
        where: { identification: newIdentification },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Ya existe un cliente registrado con el número de documento ${newIdentification}`,
        );
      }
      client.identification = newIdentification;
    }

    if (dto.fullName !== undefined) {
      client.fullName = dto.fullName.trim();
    }
    if (dto.phone !== undefined) {
      client.phone = dto.phone.trim();
    }
    if (dto.email !== undefined) {
      client.email = dto.email.trim().toLowerCase();
    }
    if (dto.address !== undefined) {
      client.address = dto.address?.trim();
    }

    try {
      const updated = await this.clientsRepository.save(client);
      return this.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Duplicate entry') ||
          (error as { errno?: number }).errno === 1062)
      ) {
        throw new ConflictException(
          'Ya existe un cliente registrado con este número de documento',
        );
      }
      throw error;
    }
  }

  /**
   * Elimina un cliente por su ID
   */
  async remove(id: string): Promise<void> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    await this.clientsRepository.remove(client);
  }

  private toResponse(client: Client): ClientResponseDto {
    return {
      id: client.id,
      identification: client.identification,
      fullName: client.fullName,
      phone: client.phone,
      email: client.email,
      address: client.address,
      createdAt: client.createdAt,
    };
  }
}
