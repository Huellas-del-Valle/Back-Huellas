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
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../../users/entities/user.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';

@Entity('appointments')
@Index('idx_appointments_vet_dates', ['veterinarianId', 'startDateTime', 'endDateTime'])
@Index('idx_appointments_pet_id', ['petId'])
@Index('idx_appointments_client_id', ['clientId'])
@Index('idx_appointments_status', ['status'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pet_id', type: 'varchar', length: 36 })
  petId: string;

  @ManyToOne(() => Pet, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @Column({ name: 'client_id', type: 'varchar', length: 36 })
  clientId: string;

  @ManyToOne(() => Client, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'veterinarian_id', type: 'varchar', length: 36 })
  veterinarianId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian: User;

  @Column({ name: 'start_date_time', type: 'datetime', precision: 6 })
  startDateTime: Date;

  @Column({ name: 'end_date_time', type: 'datetime', precision: 6 })
  endDateTime: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDIENTE,
  })
  status: AppointmentStatus;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;
}
