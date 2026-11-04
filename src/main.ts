import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {

  const configService = new ConfigService();
  const logger = new Logger('Bootstrap', { timestamp: true });
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  /// GLOBAL ///

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    }),
  );

  app.useGlobalInterceptors( new ClassSerializerInterceptor( app.get(Reflector) ));


  /// DOC ///

  const PORT = configService.get<number>('PORT') ?? 3000;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Huellas del Valle API')
    .setDescription('API de gestión de usuarios y roles')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth()
    .addServer(`http://localhost:${PORT}`, 'Local')
    .build();
  
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  app.use(
    '/scalar',
    apiReference({
      content: document,
      theme: 'deepSpace',
      darkMode: true,
    })
  )
  SwaggerModule.setup('swagger', app, document);



  // START //
  
  await app.listen(PORT);

  logger.debug(`Server running on http://localhost:${PORT}`);
  logger.debug(`Swagger running on http://localhost:${PORT}/swagger`);
  logger.debug(`Scalar running on http://localhost:${PORT}/scalar`);
  
}
bootstrap();
