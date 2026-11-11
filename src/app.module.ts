import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { AuditMiddleware } from './auth/middlwares/login.middleware';
import { DatabaseModule } from './Database/database.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required().min(4),
      })
    }),

    DatabaseModule,
    UsersModule,
    AuthModule,
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware)
    .forRoutes(
      {
        path: 'api/v1/auth/login', method: RequestMethod.POST
      }
    )
  }
}
