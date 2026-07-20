/**
 * PaginationMeta
 *
 * Responsabilidad: describir la información de paginación que
 * acompaña a cualquier listado. El frontend la usa para pintar
 * el paginador sin cálculos adicionales.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * PaginatedResponse<T>
 *
 * Responsabilidad: contrato genérico de respuesta paginada.
 * Reutilizable por cualquier recurso (products hoy, otros después).
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
