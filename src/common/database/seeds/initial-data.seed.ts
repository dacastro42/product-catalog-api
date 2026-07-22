import { DataSource } from 'typeorm';
import { Category } from '../../../modules/categories/entities/category.entity';
import { Product } from '../../../modules/products/entities/product.entity';
import { ProductStatus } from '../../../modules/products/enums/product-status.enum';

/**
 * Seed inicial del catálogo.
 *
 * Responsabilidad: poblar categorías y productos de demostración
 * suficientes para probar búsqueda, filtros, ordenamiento,
 * paginación y estadísticas.
 *
 * IDEMPOTENTE: usa el slug (categorías) y el nombre (productos)
 * como claves naturales; si el registro ya existe, no lo duplica.
 */
export async function runInitialDataSeed(
  dataSource: DataSource,
): Promise<void> {
  const categoriesRepository = dataSource.getRepository(Category);
  const productsRepository = dataSource.getRepository(Product);

  // ---------- Categorías ----------
  const categoriesData = [
    { name: 'Tecnología', slug: 'tecnologia' },
    { name: 'Hogar', slug: 'hogar' },
    { name: 'Deportes', slug: 'deportes' },
    { name: 'Libros', slug: 'libros' },
  ];

  // Mapa slug -> entidad, para asignar categoryId a los productos.
  const categoriesBySlug = new Map<string, Category>();

  for (const data of categoriesData) {
    // Clave natural: slug. Si existe, se reutiliza; si no, se crea.
    let category = await categoriesRepository.findOne({
      where: { slug: data.slug },
    });

    if (!category) {
      category = await categoriesRepository.save(
        categoriesRepository.create(data),
      );
    }

    categoriesBySlug.set(data.slug, category);
  }

  // ---------- Productos ----------
  // Variedad deliberada: precios de 9.99 a 5999.99 (ordenamiento),
  // nombres con palabras repetidas como "inalámbrico" (búsqueda),
  // 3 inactivos (filtro por estado), 12 en total (paginación con
  // limit=10 produce 2 páginas) y Libros queda VACÍA a propósito
  // (verifica el count: 0 de las estadísticas).
  const productsData: Array<{
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    status: ProductStatus;
    categorySlug: string;
  }> = [
    {
      name: 'Laptop Lenovo ThinkPad X1',
      description:
        'Laptop empresarial de 14 pulgadas con 16GB de RAM y SSD de 512GB.',
      price: 5999.99,
      imageUrl: 'https://picsum.photos/seed/laptop/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'tecnologia',
    },
    {
      name: 'Mouse inalámbrico Logitech',
      description:
        'Mouse ergonómico inalámbrico con batería de larga duración.',
      price: 89.99,
      imageUrl: 'https://picsum.photos/seed/mouse/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'tecnologia',
    },
    {
      name: 'Teclado mecánico RGB',
      description: 'Teclado mecánico con switches rojos e iluminación RGB.',
      price: 249.5,
      imageUrl: 'https://picsum.photos/seed/teclado/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'tecnologia',
    },
    {
      name: 'Monitor 27 pulgadas 4K',
      description: 'Monitor IPS 4K con panel de 27 pulgadas para diseño.',
      price: 1499.0,
      imageUrl: 'https://picsum.photos/seed/monitor/600/400',
      status: ProductStatus.INACTIVE,
      categorySlug: 'tecnologia',
    },
    {
      name: 'Audífonos inalámbricos Sony',
      description: 'Audífonos con cancelación de ruido y 30 horas de batería.',
      price: 799.99,
      imageUrl: 'https://picsum.photos/seed/audifonos/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'tecnologia',
    },
    {
      name: 'Aspiradora robot',
      description: 'Aspiradora inteligente con mapeo láser y control por app.',
      price: 1299.99,
      imageUrl: 'https://picsum.photos/seed/aspiradora/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'hogar',
    },
    {
      name: 'Cafetera espresso',
      description: 'Cafetera espresso de 15 bares con vaporizador de leche.',
      price: 899.0,
      imageUrl: 'https://picsum.photos/seed/cafetera/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'hogar',
    },
    {
      name: 'Juego de sábanas premium',
      description: 'Sábanas de algodón egipcio de 600 hilos, tamaño queen.',
      price: 189.99,
      imageUrl: 'https://picsum.photos/seed/sabanas/600/400',
      status: ProductStatus.INACTIVE,
      categorySlug: 'hogar',
    },
    {
      name: 'Lámpara de escritorio LED',
      description: 'Lámpara LED regulable con puerto USB de carga.',
      price: 9.99,
      imageUrl: 'https://picsum.photos/seed/lampara/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'hogar',
    },
    {
      name: 'Bicicleta de montaña R29',
      description: 'Bicicleta rodado 29 con 21 velocidades y frenos de disco.',
      price: 2350.0,
      imageUrl: 'https://picsum.photos/seed/bicicleta/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'deportes',
    },
    {
      name: 'Mancuernas ajustables 24kg',
      description: 'Par de mancuernas ajustables de 2.5 a 24 kg por unidad.',
      price: 649.99,
      imageUrl: 'https://picsum.photos/seed/mancuernas/600/400',
      status: ProductStatus.ACTIVE,
      categorySlug: 'deportes',
    },
    {
      name: 'Balón de fútbol profesional',
      description: 'Balón oficial tamaño 5 cosido a máquina.',
      price: 129.5,
      imageUrl: 'https://picsum.photos/seed/balon/600/400',
      status: ProductStatus.INACTIVE,
      categorySlug: 'deportes',
    },
  ];

  for (const data of productsData) {
    // Clave natural: nombre del producto.
    const exists = await productsRepository.findOne({
      where: { name: data.name },
    });

    if (exists) {
      continue;
    }

    const category = categoriesBySlug.get(data.categorySlug);
    if (!category) {
      continue;
    }

    await productsRepository.save(
      productsRepository.create({
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        status: data.status,
        categoryId: category.id,
      }),
    );
  }
}
