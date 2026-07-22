import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../../common/pagination/paginated-response/paginated-response.interface';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductStatus } from './enums/product-status.enum';
import { ProductStats } from './interfaces/product-stats.interface';

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
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    // Reutiliza findOne: si el producto no existe (o fue eliminado
    // lógicamente), lanza 404 y el flujo se corta aquí.
    const product = await this.findOne(id);

    // Regla de negocio: si el PATCH intenta cambiar la categoría,
    // la nueva categoría debe existir (404 si no).
    if (updateProductDto.categoryId) {
      await this.categoriesService.findOne(updateProductDto.categoryId);
    }

    // Fusiona solo los campos presentes en el DTO sobre la entidad
    // cargada. Los campos no enviados conservan su valor actual:
    // esa es la semántica de PATCH (actualización parcial).
    Object.assign(product, updateProductDto);

    // save sobre una entidad con id ejecuta UPDATE, no INSERT,
    // y refresca updatedAt automáticamente (@UpdateDateColumn).
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    // Reutiliza findOne: 404 si no existe o ya fue eliminado.
    // (Eliminar dos veces el mismo producto responde 404 la segunda
    // vez: para el consumidor de la API ya no existe.)
    const product = await this.findOne(id);

    // softRemove NO borra la fila: escribe la fecha actual en
    // deletedAt (gracias a @DeleteDateColumn). A partir de ahí,
    // todas las consultas lo excluyen automáticamente.
    await this.productsRepository.softRemove(product);
  }

  async getStats(): Promise<ProductStats> {
    // Los tres conteos simples con la API declarativa.
    // El soft delete excluye los eliminados automáticamente.
    // Promise.all: las consultas viajan en paralelo, no en serie.
    const [total, active, inactive] = await Promise.all([
      this.productsRepository.count(),
      this.productsRepository.count({
        where: { status: ProductStatus.ACTIVE },
      }),
      this.productsRepository.count({
        where: { status: ProductStatus.INACTIVE },
      }),
    ]);

    // Parte de CATEGORIES con LEFT JOIN a products: toda categoría
    // aparece aunque no tenga productos (count = 0).
    // La condición de soft delete va en el ON del JOIN para no
    // descartar las categorías vacías.
    //
    // Agregación condicional: COUNT solo cuenta valores NO nulos,
    // así que "CASE WHEN status = 'ACTIVE' THEN 1 END" produce
    // 1 para activos y NULL para el resto -> cuenta solo activos.
    // El status va parametrizado (:active/:inactive), nunca
    // concatenado, igual que cualquier valor externo.
    const rawByCategory = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoin(
        Product,
        'product',
        'product.categoryId = category.id AND product.deletedAt IS NULL',
      )
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(product.id)', 'count')
      .addSelect(
        'COUNT(CASE WHEN product.status = :active THEN 1 END)',
        'active',
      )
      .addSelect(
        'COUNT(CASE WHEN product.status = :inactive THEN 1 END)',
        'inactive',
      )
      .setParameters({
        active: ProductStatus.ACTIVE,
        inactive: ProductStatus.INACTIVE,
      })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('count', 'DESC')
      .addOrderBy('category.name', 'ASC')
      .getRawMany<{
        categoryId: string;
        categoryName: string;
        count: string;
        active: string;
        inactive: string;
      }>();

    // Los agregados llegan como string desde PostgreSQL (bigint):
    // se convierten a number para cumplir el contrato.
    const byCategory = rawByCategory.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      count: Number(row.count),
      active: Number(row.active),
      inactive: Number(row.inactive),
    }));

    return { total, active, inactive, byCategory };
  }
}
