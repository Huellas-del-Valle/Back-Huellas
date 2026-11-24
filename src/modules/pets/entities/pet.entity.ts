import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

@Entity('pets')
@Index('idx_pets_unique_code', ['uniqueCode'], { unique: true })
@Index('idx_pets_client_id', ['clientId'])
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unique_code', type: 'varchar', length: 50, unique: true })
  uniqueCode: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  species: string;

  @Column({ type: 'varchar', length: 100 })
  breed: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: string;

  @Column({ name: 'client_id', type: 'varchar', length: 36 })
  clientId: string;

  @ManyToOne(() => Client, (client) => client.pets, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;
}
