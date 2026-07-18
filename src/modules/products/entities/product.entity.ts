import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductStatus } from '../enums/product-status.enum';

/**
 * ProductEntity
 *
 * Responsabilidad: representar la tabla "products" en PostgreSQL.
 * Un producto pertenece a una categoría (N:1) y usa borrado lógico
 * mediante deletedAt (requisito de la prueba).
 */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Índice para acelerar la búsqueda por nombre (ILIKE) del listado.
  @Index()
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  // numeric(12,2): hasta 10 dígitos enteros y 2 decimales, sin errores
  // de redondeo de flotantes (requisito de la prueba).
  // PostgreSQL devuelve numeric como string; el transformer lo convierte
  // a number al leer, para que la API responda price: 1499.99 y no "1499.99".
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number): number => value,
      from: (value: string): number => parseFloat(value),
    },
  })
  price!: number;

  // La imagen se maneja como URL externa; no hay almacenamiento físico.
  @Column({ type: 'varchar', length: 500 })
  imageUrl!: string;

  // Enum nativo de PostgreSQL. Por defecto los productos nacen activos.
  @Index()
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status!: ProductStatus;

  // Columna FK explícita: permite filtrar por categoryId sin hacer JOIN
  // y recibir/exponer el id plano en DTOs y respuestas.
  @Index()
  @Column({ type: 'uuid' })
  categoryId!: string;

  // Relación N:1 hacia Category. RESTRICT impide borrar una categoría
  // que aún tenga productos, protegiendo la integridad del catálogo.
  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  // @DeleteDateColumn activa el soft delete nativo de TypeORM:
  // softRemove/softDelete escriben la fecha en lugar de borrar la fila,
  // y los find() excluyen automáticamente los registros con deletedAt.
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
