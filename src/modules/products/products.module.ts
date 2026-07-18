import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

/**
 * ProductsModule
 *
 * Responsabilidad: ensamblar el recurso de productos. Importa
 * CategoriesModule para poder validar la existencia de la
 * categoría al crear o actualizar productos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product]), CategoriesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
