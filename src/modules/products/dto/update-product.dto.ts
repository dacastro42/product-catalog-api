import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * UpdateProductDto
 *
 * Responsabilidad: mismos campos que la creación pero todos
 * opcionales. PartialType hereda las validaciones y las aplica
 * solo a los campos presentes en el PATCH.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
