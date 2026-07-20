import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../../common/pagination/paginated-response/paginated-response.interface';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
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

  async findAll(
    queryDto: QueryProductsDto,
  ): Promise<PaginatedResponse<Product>> {
    const { page, limit, search, categoryId, status, sortBy, sortOrder } =
      queryDto;

    // QueryBuilder: construye la consulta SQL dinámicamente.
    // El alias 'product' nombra la tabla dentro de la consulta.
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      // Trae la categoría en la misma consulta (LEFT JOIN) para que
      // el frontend muestre su nombre sin una segunda petición.
      .leftJoinAndSelect('product.category', 'category');

    // Cada filtro se agrega SOLO si el parámetro llegó.
    // Los valores van como parámetros (:search) — el driver los
    // escapa y previene inyección SQL.
    if (search) {
      // ILIKE: búsqueda parcial case-insensitive de PostgreSQL.
      queryBuilder.andWhere('product.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId,
      });
    }

    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    // ORDER BY no admite parámetros: sortBy/sortOrder se concatenan,
    // pero el DTO ya garantizó con lista blanca que solo pueden ser
    // 'name'|'price' y 'asc'|'desc'. Nunca llega texto libre aquí.
    queryBuilder.orderBy(
      `product.${sortBy}`,
      sortOrder.toUpperCase() as 'ASC' | 'DESC',
    );

    // Paginación en SQL: LIMIT + OFFSET.
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Ejecuta el SELECT paginado y el COUNT con los mismos filtros.
    // El soft delete (deletedAt IS NULL) se aplica automáticamente
    // gracias a @DeleteDateColumn en la entidad.
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    // Busca por id incluyendo la categoría (JOIN), igual que el listado.
    // El soft delete aplica solo: si el producto fue eliminado
    // lógicamente, findOne no lo encuentra y respondemos 404.
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return product;
  }

  update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    void id;
    void updateProductDto;
    throw new NotImplementedException('Actualización disponible próximamente');
  }

  remove(id: string): Promise<void> {
    void id;
    throw new NotImplementedException('Eliminación disponible próximamente');
  }
}
