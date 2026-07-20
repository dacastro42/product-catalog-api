import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export enum ProductSortBy {
  NAME = 'name',
  PRICE = 'price',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * QueryProductsDto
 *
 * Responsabilidad: validar query params del listado de productos
 * (paginación, filtros y ordenamiento). Lista blanca en sortBy/
 * sortOrder para que el service pueda concatenarlos en ORDER BY
 * sin riesgo de inyección SQL.
 */
export class QueryProductsDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero' })
  @Min(1, { message: 'page debe ser al menos 1' })
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(100, { message: 'limit no puede superar 100' })
  limit: number = 10;

  @ApiPropertyOptional({
    example: 'laptop',
    description: 'Búsqueda parcial por nombre (case-insensitive)',
  })
  @IsOptional()
  @IsString({ message: 'search debe ser un texto' })
  search?: string;

  @ApiPropertyOptional({
    example: 'a3f1c2e4-5b6d-4e7f-8a9b-0c1d2e3f4a5b',
    description: 'Filtrar por UUID de categoría',
  })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId debe ser un UUID válido' })
  categoryId?: string;

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Filtrar por estado del producto',
  })
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'status debe ser ACTIVE o INACTIVE',
  })
  status?: ProductStatus;

  @ApiPropertyOptional({
    enum: ProductSortBy,
    default: ProductSortBy.NAME,
    description: 'Campo de ordenamiento (lista blanca)',
  })
  @IsOptional()
  @IsEnum(ProductSortBy, {
    message: 'sortBy debe ser name o price',
  })
  sortBy: ProductSortBy = ProductSortBy.NAME;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.ASC,
    description: 'Dirección de ordenamiento',
  })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'sortOrder debe ser asc o desc',
  })
  sortOrder: SortOrder = SortOrder.ASC;
}
