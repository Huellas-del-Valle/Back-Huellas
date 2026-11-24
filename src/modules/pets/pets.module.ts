import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { Client } from '../clients/entities/client.entity';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { PetCodeGeneratorService } from './pet-code-generator.service';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet, Client]),
    forwardRef(() => ClientsModule),
  ],
  controllers: [PetsController],
  providers: [PetsService, PetCodeGeneratorService],
  exports: [PetsService, PetCodeGeneratorService, TypeOrmModule],
})
export class PetsModule {}
