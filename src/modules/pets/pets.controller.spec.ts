import { Test, TestingModule } from '@nestjs/testing';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { PetResponseDto } from './dto/pet-response.dto';
import { PetGender } from './enums/pet-gender.enum';

describe('PetsController', () => {
  let controller: PetsController;
  let service: PetsService;

  const mockPetResponse: PetResponseDto = {
    id: 'b0000000-0000-0000-0000-000000000001',
    uniqueCode: 'HUV-2026-0001',
    name: 'Mascota ejemplo',
    species: 'CANINO',
    breed: 'Labrador',
    birthDate: '2024-01-15',
    gender: 'MACHO',
    client: {
      id: 'a0000000-0000-0000-0000-000000000001',
      fullName: 'user ejemplo',
    },
    createdAt: new Date('2026-11-23T19:00:00.000Z'),
    updatedAt: new Date('2026-11-23T19:00:00.000Z'),
  };

  const mockPetsService = {
    create: jest.fn().mockResolvedValue(mockPetResponse),
    findOne: jest.fn().mockResolvedValue(mockPetResponse),
    findAll: jest.fn().mockResolvedValue([mockPetResponse]),
    findByClientId: jest.fn().mockResolvedValue([mockPetResponse]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetsController],
      providers: [
        {
          provide: PetsService,
          useValue: mockPetsService,
        },
      ],
    }).compile();

    controller = module.get<PetsController>(PetsController);
    service = module.get<PetsService>(PetsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return created pet', async () => {
      const dto: CreatePetDto = {
        code: 'HUV-2026-0001',
        name: 'Mascota ejemplo',
        species: 'CANINO',
        breed: 'Labrador',
        birthDate: '2024-01-15',
        gender: PetGender.MACHO,
        clientId: 'a0000000-0000-0000-0000-000000000001',
      };

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPetResponse);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return the pet', async () => {
      const result = await controller.findOne(mockPetResponse.id);

      expect(service.findOne).toHaveBeenCalledWith(mockPetResponse.id);
      expect(result).toEqual(mockPetResponse);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return array of pets', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockPetResponse]);
    });
  });
});
