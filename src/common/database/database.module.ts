import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * DatabaseModule
 *
 * Responsabilidad: centralizar la configuración de la conexión
 * a PostgreSQL mediante TypeORM. Ningún otro módulo debe conocer
 * los detalles de conexión; solo registran sus entidades con
 * TypeOrmModule.forFeature().
 */
@Module({
  imports: [
    // forRootAsync permite inyectar ConfigService para leer el .env,
    // en lugar de acceder directamente a process.env (regla de la prueba).
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        // Cada valor se lee tipado desde las variables de entorno.
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),

        // TypeORM detecta automáticamente las entidades registradas
        // con forFeature() en cada módulo, sin listas manuales.
        autoLoadEntities: true,

        // TEMPORAL: crea/actualiza tablas desde las entidades.
        // Antes de finalizar la prueba se cambia a false y se usan
        // migraciones (etapa posterior del plan).
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
