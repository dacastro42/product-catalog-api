import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

/**
 * CategoriesModule
 *
 * Responsabilidad: ensamblar el recurso de categorías y registrar
 * la entidad para que TypeORM cree su repositorio inyectable.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  // Se exporta el service para que ProductsModule pueda validar
  // que una categoría exista al crear productos (próximas etapas).
  exports: [CategoriesService],
})
export class CategoriesModule {}
