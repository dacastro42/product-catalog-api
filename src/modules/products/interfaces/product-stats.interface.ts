/**
 * CategoryProductCount
 *
 * Responsabilidad: describir el conteo de productos de una
 * categoría dentro de las estadísticas.
 */
export interface CategoryProductCount {
  categoryId: string;
  categoryName: string;
  count: number;
}

/**
 * ProductStats
 *
 * Responsabilidad: contrato de respuesta del dashboard.
 * Totales generales y desglose por categoría.
 */
export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: CategoryProductCount[];
}
