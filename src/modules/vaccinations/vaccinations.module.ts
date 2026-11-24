import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from '../pets/entities/pet.entity';
import { MailModule } from '../mail/mail.module';
import { VaccinationRecord } from './entities/vaccination-record.entity';
import { VaccinationsController } from './vaccinations.controller';
import { VaccinationsService } from './vaccinations.service';
import { VaccinationsCronService } from './vaccinations-cron.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VaccinationRecord, Pet]),
    MailModule,
  ],
  controllers: [VaccinationsController],
  providers: [VaccinationsService, VaccinationsCronService],
  exports: [VaccinationsService],
})
export class VaccinationsModule {}

export const ImmunizationModule = VaccinationsModule;
