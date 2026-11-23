import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    const isSsl =
      configService.get<string | boolean>('DB_SSL') === true ||
      configService.get<string>('DB_SSL') === 'true';

    return {
      type: 'mysql',
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: Number(configService.get<number>('DB_PORT', 3306)),
      username: configService.get<string>('DB_USERNAME', 'root'),
      password: configService.get<string>('DB_PASSWORD', 'root'),
      database: configService.get<string>('DB_DATABASE', 'huellas_del_valle'),
      synchronize:
        configService.get<string | boolean>('DB_SYNCHRONIZE') === true ||
        configService.get<string>('DB_SYNCHRONIZE') === 'true',
      logging:
        configService.get<string | boolean>('DB_LOGGING') === true ||
        configService.get<string>('DB_LOGGING') === 'true',
      autoLoadEntities: true,
      migrationsRun:
        configService.get<string | boolean>('DB_MIGRATIONS_RUN') === true ||
        configService.get<string>('DB_MIGRATIONS_RUN') === 'true',
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    };
  },
};
