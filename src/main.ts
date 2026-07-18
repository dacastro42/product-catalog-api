import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * bootstrap
 *
 * Responsabilidad: arrancar la aplicación y aplicar la configuración
 * transversal (prefijo, validación, CORS, Swagger). No contiene
 * lógica de negocio.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ConfigService en lugar de process.env directo (regla de la prueba).
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3010;
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

  // Todas las rutas quedan bajo /api/v1 (ej: /api/v1/categories).
  app.setGlobalPrefix('api/v1');

  // Validación global de DTOs:
  // - transform: convierte payloads a instancias de los DTOs (y tipos).
  // - whitelist: elimina propiedades no declaradas en el DTO.
  // - forbidNonWhitelisted: responde 400 si llegan propiedades extra.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS restringido al frontend de Next.js.
  app.enableCors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Swagger disponible en http://localhost:3010/api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Product Catalog API')
    .setDescription(
      'API REST para administrar un catálogo de productos y categorías.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
}

void bootstrap();
