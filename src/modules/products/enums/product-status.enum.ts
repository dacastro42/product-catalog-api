/**
 * ProductStatus
 *
 * Responsabilidad: representar los únicos dos estados válidos
 * de un producto. Se persiste como enum nativo de PostgreSQL
 * y se reutiliza en la entidad, los DTOs y los filtros.
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
