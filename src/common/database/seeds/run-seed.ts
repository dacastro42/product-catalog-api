import dataSource from '../data-source';
import { runInitialDataSeed } from './initial-data.seed';

/**
 * Punto de entrada del seed: inicializa la conexión, ejecuta el
 * seed idempotente y cierra. Pensado para correr como script
 * (npm run seed) tanto en local como dentro de Docker.
 */
async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    await runInitialDataSeed(dataSource);
    console.log('Seed ejecutado correctamente');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Error ejecutando el seed:', error);
  process.exit(1);
});
