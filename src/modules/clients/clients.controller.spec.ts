import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';

describe('ClientsController', () => {
  let controller: ClientsController;
  let service: ClientsService;

  const mockClientResponse: ClientResponseDto = {
    id: 'a0000000-0000-0000-0000-000000000001',
    identification: '1088000111',
    fullName: 'user ejemplo',
    phone: '3001234567',
    email: 'userejemplo@huellas.com',
    address: 'Calle Ejemplo 123',
    createdAt: new Date('2026-11-23T19:00:00.000Z'),
  };

  const mockClientsService = {
    create: jest.fn().mockResolvedValue(mockClientResponse),
    search: jest.fn().mockResolvedValue([mockClientResponse]),
    findAll: jest.fn().mockResolvedValue({
      data: [mockClientResponse],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
    findOne: jest.fn().mockResolvedValue(mockClientResponse),
    update: jest.fn().mockResolvedValue({
      ...mockClientResponse,
      fullName: 'user modificado',
    }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockClientsService,
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    service = module.get<ClientsService>(ClientsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return created client', async () => {
      const dto: CreateClientDto = {
        identification: '1088000111',
        fullName: 'user ejemplo',
        phone: '3001234567',
        email: 'userejemplo@huellas.com',
        address: 'Calle Ejemplo 123',
      };

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockClientResponse);
    });
  });

  describe('search', () => {
    it('should call service.search with query and return array', async () => {
      const result = await controller.search({ query: '1088' });

      expect(service.search).toHaveBeenCalledWith('1088');
      expect(result).toEqual([mockClientResponse]);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return paginated list', async () => {
      const query = { page: 1, limit: 20 };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result.data).toEqual([mockClientResponse]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return client', async () => {
      const result = await controller.findOne(mockClientResponse.id);

      expect(service.findOne).toHaveBeenCalledWith(mockClientResponse.id);
      expect(result).toEqual(mockClientResponse);
    });
  });

  describe('update', () => {
    it('should call service.update and return updated client', async () => {
      const dto: UpdateClientDto = { fullName: 'user modificado' };
      const result = await controller.update(mockClientResponse.id, dto);

      expect(service.update).toHaveBeenCalledWith(mockClientResponse.id, dto);
      expect(result.fullName).toBe('user modificado');
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      await controller.remove(mockClientResponse.id);

      expect(service.remove).toHaveBeenCalledWith(mockClientResponse.id);
    });
  });
});
