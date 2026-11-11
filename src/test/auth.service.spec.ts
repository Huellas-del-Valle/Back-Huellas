    import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findOneBy: {
      email: jest.fn(),
      name: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    const validUser = {
      id: 1,
      email: 'test@test.com',
      name: 'testuser',
      fullName: 'Test User',
      role: 'admin',
      passwordHash: 'hashedPassword',
    };

    it('should throw BadRequestException if neither email nor name are provided', async () => {
      const dto = { password: 'password123' } as any;

      await expect(authService.login(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if user does not exist by email', async () => {
      mockUsersService.findOneBy.email.mockResolvedValue(undefined);

      const dto = { email: 'unknown@test.com', password: 'password123' };

      await expect(authService.login(dto)).rejects.toThrow(NotFoundException);
      expect(usersService.findOneBy.email).toHaveBeenCalledWith('unknown@test.com');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockUsersService.findOneBy.email.mockResolvedValue(validUser.email);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const dto = { email: 'test@test.com', password: 'wrongPassword' };

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', undefined);
    });

    it('should successfully log in and return access token and user data when credentials are valid (by email)', async () => {
      mockUsersService.findOneBy.email.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const expectedToken = 'mocked_jwt_token';
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const dto = { email: 'test@test.com', password: 'password123' };
      const result = await authService.login(dto);

      expect(usersService.findOneBy.email).toHaveBeenCalledWith('test@test.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: validUser.id,
        name: validUser.fullName,
        role: validUser.role,
      });
      expect(result).toEqual({
        message: 'Inicio de sesión exitoso',
        data: validUser,
        accessToken: expectedToken,
      });
    });

    it('should successfully log in using name instead of email', async () => {
      mockUsersService.findOneBy.name.mockResolvedValue(validUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const expectedToken = 'mocked_jwt_token';
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const dto = { name: 'testuser', password: 'password123' };
      const result = await authService.login(dto);

      expect(usersService.findOneBy.name).toHaveBeenCalledWith('testuser');
      expect(result.accessToken).toEqual(expectedToken);
    });
  });
});