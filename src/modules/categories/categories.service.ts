import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

/**
 * CategoriesService
 *
 * Responsabilidad: reglas de negocio de categorías (unicidad de
 * name/slug, existencia) y coordinación con el repositorio.
 * Lanza excepciones de NestJS que luego el filtro global de
 * errores convertirá en respuestas uniformes.
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verifica unicidad de name o slug antes de insertar,
    // para responder 409 con mensaje claro en lugar del error crudo de PostgreSQL.
    const existing = await this.categoriesRepository.findOne({
      where: [
        { name: createCategoryDto.name },
        { slug: createCategoryDto.slug },
      ],
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe una categoría con ese nombre o slug',
      );
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    // Orden alfabético: es el listado que consumirá el frontend
    // para poblar selects y filtros.
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }
}