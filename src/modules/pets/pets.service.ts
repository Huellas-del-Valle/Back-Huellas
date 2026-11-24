import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePetDto } from './dto/create-pet.dto';
import { PetResponseDto } from './dto/pet-response.dto';
import { Pet } from './entities/pet.entity';
import { Client } from '../clients/entities/client.entity';
import { PetCodeGeneratorService } from './pet-code-generator.service';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly petCodeGeneratorService: PetCodeGeneratorService,
  ) {}

  /**
   * Registra una nueva mascota asociada a un cliente, con código unívoco garantizado.
   */
  async create(dto: CreatePetDto): Promise<PetResponseDto> {
    // 1. Validar integridad referencial: existencia del cliente
    const client = await this.clientsRepository.findOne({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException(
        `Cliente con ID ${dto.clientId} no encontrado`,
      );
    }

    // 2. Determinar o autogenerar código unívoco
    const rawCode = (dto.code || dto.uniqueCode)?.trim();
    const isExplicitCode = Boolean(rawCode);
    let code: string;

    if (isExplicitCode) {
      if (!this.petCodeGeneratorService.isValidCodeFormat(rawCode!)) {
        throw new BadRequestException(
          'El formato del código debe ser HUV-YYYY-XXXX (ej: HUV-2026-0001)',
        );
      }

      const existingPet = await this.petsRepository.findOne({
        where: { uniqueCode: rawCode },
      });
      if (existingPet) {
        throw new ConflictException(
          `Ya existe una mascota registrada con el código ${rawCode}`,
        );
      }
      code = rawCode!;
    } else {
      code = await this.petCodeGeneratorService.generateCode();
    }

    // 3. Crear entidad y persistir con reintento ante concurrencia
    let attempts = 0;
    while (attempts < 3) {
      const pet = this.petsRepository.create({
        uniqueCode: code,
        name: dto.name.trim(),
        species: dto.species.trim(),
        breed: dto.breed.trim(),
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        clientId: client.id,
        client: client,
      });

      try {
        const saved = await this.petsRepository.save(pet);
        return this.toResponse(saved, client);
      } catch (error) {
        if (this.isDuplicateKeyError(error)) {
          if (!isExplicitCode && attempts < 2) {
            attempts++;
            code = await this.petCodeGeneratorService.generateCode();
            continue;
          }
          throw new ConflictException(
            `Ya existe una mascota registrada con el código ${code}`,
          );
        }
        throw error;
      }
    }

    throw new ConflictException(
      'No se pudo generar un código único disponible tras varios intentos',
    );
  }

  /**
   * Obtiene una mascota por su ID (UUID)
   */
  async findOne(id: string): Promise<PetResponseDto> {
    const pet = await this.petsRepository.findOne({
      where: { id },
      relations: ['client'],
    });

    if (!pet) {
      throw new NotFoundException(`Mascota con ID ${id} no encontrada`);
    }

    return this.toResponse(pet);
  }

  /**
   * Consulta todas las mascotas asociadas a un cliente específico
   */
  async findByClientId(clientId: string): Promise<PetResponseDto[]> {
    const client = await this.clientsRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }

    const pets = await this.petsRepository.find({
      where: { clientId },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });

    return pets.map((pet) => this.toResponse(pet, client));
  }

  /**
   * Lista todas las mascotas registradas
   */
  async findAll(): Promise<PetResponseDto[]> {
    const pets = await this.petsRepository.find({
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });

    return pets.map((pet) => this.toResponse(pet));
  }

  /**
   * Transforma una entidad Pet en el DTO de respuesta estandarizado
   */
  private toResponse(pet: Pet, client?: Client): PetResponseDto {
    const resolvedClient = client || pet.client;

    let formattedBirthDate: string | undefined = undefined;
    if (pet.birthDate) {
      formattedBirthDate =
        pet.birthDate instanceof Date
          ? pet.birthDate.toISOString().split('T')[0]
          : String(pet.birthDate);
    }

    return {
      id: pet.id,
      uniqueCode: pet.uniqueCode,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      ...(formattedBirthDate ? { birthDate: formattedBirthDate } : {}),
      ...(pet.gender ? { gender: pet.gender } : {}),
      client: {
        id: resolvedClient?.id || pet.clientId,
        fullName: resolvedClient?.fullName || '',
      },
      createdAt: pet.createdAt,
      updatedAt: pet.updatedAt,
    };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!error) return false;
    const msg = error instanceof Error ? error.message : '';
    const errno = (error as { errno?: number }).errno;
    const code = (error as { code?: string }).code;

    return (
      msg.includes('Duplicate entry') ||
      msg.includes('UNIQUE constraint') ||
      errno === 1062 ||
      code === 'ER_DUP_ENTRY'
    );
  }
}
