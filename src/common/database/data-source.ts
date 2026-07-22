import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource para la CLI de TypeORM (generar/ejecutar migraciones).
 *
 * La CLI corre FUERA de NestJS, por eso lee el .env con dotenv
 * directamente en lugar de ConfigService. La app en ejecución
 * sigue usando DatabaseModule; este archivo es solo para tooling.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'product_catalog',
  // Patrones de archivos: la CLI necesita encontrar las entidades
  // para comparar contra la BD, y las migraciones para ejecutarlas.
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/common/database/migrations/*.ts'],
});
