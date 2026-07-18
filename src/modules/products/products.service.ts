import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

/**
 * ProductsService
 *
 * Responsabilidad: reglas de negocio de productos. Coordina el
 * repositorio de productos y delega en CategoriesService la
 * verificación de existencia de la categoría.
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Regla de negocio: la categoría debe existir.
    // findOne lanza NotFoundException (404) si el UUID no corresponde
    // a ninguna categoría, cortando el flujo aquí.
    await this.categoriesService.findOne(createProductDto.categoryId);

    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  findAll(): Promise<Product[]> {
    // Se implementa con paginación y filtros en la siguiente etapa.
    throw new NotImplementedException('Listado disponible próximamente');
  }

  findOne(id: string): Promise<Product> {
    throw new NotImplementedException('Detalle disponible próximamente');
  }

  update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    throw new NotImplementedException('Actualización disponible próximamente');
  }

  remove(id: string): Promise<void> {
    throw new NotImplementedException('Eliminación disponible próximamente');
  }
}
