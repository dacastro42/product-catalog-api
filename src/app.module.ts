import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { CategoriesModule } from './modules/categories/categories.module';

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
    DatabaseModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
