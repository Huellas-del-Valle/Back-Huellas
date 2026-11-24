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
import { Pet } from '../../pets/entities/pet.entity';

@Entity('vaccination_records')
@Index('idx_vaccination_records_pet_id', ['petId'])
@Index('idx_vaccination_records_due_notified', ['notified', 'nextDueDate'])
export class VaccinationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pet_id', type: 'varchar', length: 36 })
  petId: string;

  @ManyToOne(() => Pet, (pet) => pet.vaccinationRecords, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'batch_number', type: 'varchar', length: 100 })
  batchNumber: string;

  @Column({ name: 'application_date', type: 'date' })
  applicationDate: string;

  @Column({ name: 'next_due_date', type: 'date' })
  nextDueDate: string;

  @Column({ type: 'boolean', default: false })
  notified: boolean;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;
}
