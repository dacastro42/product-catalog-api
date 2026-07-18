import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * CreateCategoryDto
 *
 * Responsabilidad: definir y validar los datos de entrada para
 * crear una categoría. El slug se exige en minúsculas con guiones,
 * el formato estándar para URLs.
 */
export class CreateCategoryDto {
  @ApiProperty({
    example: 'Tecnología',
    description: 'Nombre visible de la categoría',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  name!: string;

  @ApiProperty({
    example: 'tecnologia',
    description: 'Identificador URL-friendly (minúsculas, números y guiones)',
  })
  @IsString({ message: 'El slug debe ser un texto' })
  @MinLength(2, { message: 'El slug debe tener mínimo 2 caracteres' })
  @MaxLength(120, { message: 'El slug no puede superar 120 caracteres' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'El slug solo admite minúsculas, números y guiones (ej: ropa-deportiva)',
  })
  slug!: string;
}
