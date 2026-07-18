import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * CategoryEntity
 *
 * Responsabilidad: representar la tabla "categories" en PostgreSQL.
 * Una categoría agrupa productos (relación 1:N que se configura
 * del lado de Product en una etapa posterior).
 */
@Entity('categories')
export class Category {
  // UUID generado por PostgreSQL, requisito.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Nombre visible de la categoría. Único para evitar duplicados.
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  // Slug: versión URL-friendly del nombre (ej: "Ropa Deportiva" -> "ropa-deportiva").
  // También único porque suele usarse como identificador en URLs del frontend.
  @Column({ type: 'varchar', length: 120, unique: true })
  slug!: string;

  // Timestamps automáticos gestionados por TypeORM.
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
