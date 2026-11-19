import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigAsync } from '../config/database.config';

@Module({
  imports: [TypeOrmModule.forRootAsync(typeOrmConfigAsync)],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
