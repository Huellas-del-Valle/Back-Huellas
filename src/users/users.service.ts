import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(query: ListUsersQueryDto) {
    const [users, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: users.map((user) => this.toResponse(user)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  findOneBy = {

    id: async (id: string): Promise<User> => {

      const user = await this.usersRepository.findOne({
        where: { id },
      });
      if (!user) throw new NotFoundException('user not found');
      return user;
    },

    name: async (name: string): Promise<User> => {

      const user = await this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.fullName = :name', { name })
        .getOne();
      if (!user) throw new NotFoundException('user not found');
      return user;
    },

    email: async (email: string): Promise<User> => {

      const user = await this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email })
        .getOne();
      if (!user) throw new NotFoundException('user not found');
      return user;
    },

  };

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOneBy({ email });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = this.usersRepository.create({
      fullName: dto.fullName.trim(),
      email,
      passwordHash: await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS),
      role: dto.role,
      isActive: true,
    });

    try {
      return this.toResponse(await this.usersRepository.save(user));
    } catch (error) {
      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = dto.isActive;
    return this.toResponse(await this.usersRepository.save(user));
  }

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
