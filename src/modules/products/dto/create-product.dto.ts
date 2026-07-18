import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

/**
 * CreateProductDto
 *
 * Responsabilidad: definir y validar los datos de entrada para
 * crear un producto. Toda validación de formato vive aquí;
 * las reglas de negocio (ej: que la categoría exista) viven
 * en el service.
 */
export class CreateProductDto {
  @ApiProperty({
    example: 'Laptop Lenovo ThinkPad X1',
    description: 'Nombre del producto',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(3, { message: 'El nombre debe tener mínimo 3 caracteres' })
  @MaxLength(150, { message: 'El nombre no puede superar 150 caracteres' })
  name!: string;

  @ApiProperty({
    example: 'Laptop empresarial de 14 pulgadas con 16GB de RAM.',
    description: 'Descripción detallada del producto',
  })
  @IsString({ message: 'La descripción debe ser un texto' })
  @MinLength(10, { message: 'La descripción debe tener mínimo 10 caracteres' })
  description!: string;

  @ApiProperty({
    example: 4999.99,
    description: 'Precio en formato numérico con máximo 2 decimales',
  })
  // Convierte "4999.99" (string del JSON) a number antes de validar.
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con máximo 2 decimales' },
  )
  @IsPositive({ message: 'El precio debe ser mayor que 0' })
  // Tope coherente con numeric(12,2): 10 dígitos enteros.
  @Max(9999999999.99, { message: 'El precio supera el máximo permitido' })
  price!: number;

  @ApiProperty({
    example: 'https://images.example.com/products/laptop-x1.jpg',
    description: 'URL de la imagen del producto (no se almacena el archivo)',
  })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'imageUrl debe ser una URL válida con http o https' },
  )
  @MaxLength(500, { message: 'La URL no puede superar 500 caracteres' })
  imageUrl!: string;

  @ApiPropertyOptional({
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
    description: 'Estado del producto. Si se omite, nace ACTIVE.',
  })
  // Opcional: la entidad tiene default ACTIVE en la base de datos.
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'status debe ser ACTIVE o INACTIVE',
  })
  status?: ProductStatus;

  @ApiProperty({
    example: 'a3f1c2e4-5b6d-4e7f-8a9b-0c1d2e3f4a5b',
    description: 'UUID de la categoría a la que pertenece el producto',
  })
  @IsUUID('4', { message: 'categoryId debe ser un UUID válido' })
  categoryId!: string;
}
