import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<Repository<Client>>;

  const mockDate = new Date('2026-11-23T19:00:00.000Z');

  const mockClient: Client = {
    id: 'a0000000-0000-0000-0000-000000000001',
    identification: '1088000111',
    fullName: 'user ejemplo',
    phone: '3001234567',
    email: 'userejemplo@huellas.com',
    address: 'Calle Ejemplo 123',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const createQueryBuilderMock = {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([mockClient]),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'a0000000-0000-0000-0000-000000000001',
      createdAt: mockDate,
      updatedAt: mockDate,
    })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    repository = module.get(getRepositoryToken(Client));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateClientDto = {
      identification: '1088000111',
      fullName: 'user ejemplo',
      phone: '3001234567',
      email: 'userejemplo@huellas.com',
      address: 'Calle Ejemplo 123',
    };

    it('should successfully create and return a client', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue({
        ...mockClient,
      });

      const result = await service.create(createDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { identification: '1088000111' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        identification: '1088000111',
        fullName: 'user ejemplo',
        phone: '3001234567',
        email: 'userejemplo@huellas.com',
        address: 'Calle Ejemplo 123',
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockClient.id,
        identification: mockClient.identification,
        fullName: mockClient.fullName,
        phone: mockClient.phone,
        email: mockClient.email,
        address: mockClient.address,
        createdAt: mockClient.createdAt,
      });
    });

    it('should throw ConflictException if client with identification already exists', async () => {
      repository.findOne.mockResolvedValue(mockClient);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { identification: '1088000111' },
      });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if database reports duplicate entry error (errno 1062)', async () => {
      repository.findOne.mockResolvedValue(null);
      const duplicateError = new Error('Duplicate entry for key identification');
      (duplicateError as any).errno = 1062;
      repository.save.mockRejectedValue(duplicateError);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('search', () => {
    it('should return clients matching identification or phone using indexed query', async () => {
      createQueryBuilderMock.getMany.mockResolvedValue([mockClient]);

      const result = await service.search('1088');

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('client');
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        'client.identification LIKE :prefix',
        { prefix: '1088%' },
      );
      expect(createQueryBuilderMock.orWhere).toHaveBeenCalledWith(
        'client.phone LIKE :prefix',
        { prefix: '1088%' },
      );
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(50);
      expect(result).toEqual([
        {
          id: mockClient.id,
          identification: mockClient.identification,
          fullName: mockClient.fullName,
          phone: mockClient.phone,
          email: mockClient.email,
          address: mockClient.address,
          createdAt: mockClient.createdAt,
        },
      ]);
    });

    it('should return empty array if query is empty or blank', async () => {
      const result = await service.search('   ');
      expect(result).toEqual([]);
      expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated clients with metadata', async () => {
      repository.findAndCount.mockResolvedValue([[mockClient], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: [
          {
            id: mockClient.id,
            identification: mockClient.identification,
            fullName: mockClient.fullName,
            phone: mockClient.phone,
            email: mockClient.email,
            address: mockClient.address,
            createdAt: mockClient.createdAt,
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should use default page 1 and limit 20 when not provided', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({} as any);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return client if found by ID', async () => {
      repository.findOne.mockResolvedValue(mockClient);

      const result = await service.findOne(mockClient.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockClient.id },
      });
      expect(result.id).toBe(mockClient.id);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateClientDto = {
      fullName: 'user actualizado',
      phone: '3009876543',
    };

    it('should update client successfully', async () => {
      repository.findOne.mockResolvedValue({ ...mockClient });
      repository.save.mockImplementation((client) => Promise.resolve(client));

      const result = await service.update(mockClient.id, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockClient.id },
      });
      expect(result.fullName).toBe('user actualizado');
      expect(result.phone).toBe('3009876543');
    });

    it('should throw ConflictException if updated identification belongs to another client', async () => {
      repository.findOne
        .mockResolvedValueOnce({ ...mockClient }) // find client to update
        .mockResolvedValueOnce({
          ...mockClient,
          id: 'another-client-id',
          identification: '9999999999',
        }); // find existing duplicate

      await expect(
        service.update(mockClient.id, { identification: '9999999999' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if updating non-existent client', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove client if found', async () => {
      repository.findOne.mockResolvedValue(mockClient);
      repository.remove.mockResolvedValue(mockClient);

      await service.remove(mockClient.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockClient.id },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockClient);
    });

    it('should throw NotFoundException if client to remove is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
