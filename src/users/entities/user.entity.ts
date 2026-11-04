import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @IsEmail()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @IsEnum(UserRole)
  @Column({ type: 'enum', enum: UserRole, default: UserRole.AUXILIAR })
  role: UserRole;

  @IsBoolean()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @IsDate()
  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  @IsDate()
  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;
}
