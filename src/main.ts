// src/main.ts

import * as compression from 'compression';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configuración global de pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Middleware de seguridad
  app.use(helmet());
  app.use(compression());

  // Configuración de CORS
  app.enableCors();

  // Prefijo global para la API
  app.setGlobalPrefix('api');

  // Configuración de Swagger
  //if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('Archive Master API')
    .setDescription('Document Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  //}

  // Iniciar el servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
