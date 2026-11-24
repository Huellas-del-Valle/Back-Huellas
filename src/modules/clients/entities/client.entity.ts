import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from '../../pets/entities/pet.entity';

@Entity('clients')
@Index('idx_clients_identification', ['identification'], { unique: true })
@Index('idx_clients_phone', ['phone'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  identification: string;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @OneToMany(() => Pet, (pet) => pet.client)
  pets: Pet[];

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;
}
