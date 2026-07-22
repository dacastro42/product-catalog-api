import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * HealthModule
 *
 * Responsabilidad: exponer el estado de salud de la API y sus
 * dependencias (PostgreSQL). Lo consumen monitores externos,
 * orquestadores (Docker/Kubernetes) y el evaluador de la prueba.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
