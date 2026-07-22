import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';

/**
 * AppModule
 *
 * Responsabilidad: módulo raíz. Solo ensambla los módulos de la
 * aplicación; no contiene lógica de negocio.
 */
@Module({
  imports: [
    // isGlobal: true hace que ConfigService esté disponible en toda
    // la app sin re-importar ConfigModule en cada módulo.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting: máximo 60 solicitudes por minuto por cliente (IP).
    // ttl en milisegundos (60000 = 1 minuto).
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    DatabaseModule,
    CategoriesModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard global: aplica el límite a TODOS los endpoints sin
    // decorar cada controller.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
