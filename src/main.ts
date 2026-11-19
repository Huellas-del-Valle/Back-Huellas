import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap', { timestamp: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT', 3000);

  // Global Prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs', 'api/docs-json', 'scalar'],
  });

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Interceptor
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // OpenAPI Swagger Documentation at /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Huellas del Valle API')
    .setDescription('API de gestión del sistema Huellas del Valle')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth()
    .addServer(`http://localhost:${PORT}`, 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Scalar UI (Alternative interactive docs)
  app.use(
    '/scalar',
    apiReference({
      content: document,
      theme: 'deepSpace',
      darkMode: true,
    }),
  );

  await app.listen(PORT);

  logger.log(`Server running on http://localhost:${PORT}/api/v1`);
  logger.log(`Swagger documentation accessible at http://localhost:${PORT}/api/docs`);
  logger.log(`Health check accessible at http://localhost:${PORT}/api/v1/health`);
}
bootstrap();
