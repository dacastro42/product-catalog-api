import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * HealthController
 *
 * Responsabilidad: responder GET /api/v1/health verificando que
 * la API está viva y que PostgreSQL responde. Sin lógica propia:
 * Terminus ejecuta los indicadores y arma la respuesta estándar.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    // Indicador de TypeORM: ejecuta un ping (SELECT 1) sobre la
    // conexión activa a PostgreSQL.
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  // Los monitores consultan health cada pocos segundos: se excluye
  // del rate limiting para que el propio monitoreo no agote la cuota.
  @SkipThrottle()
  // @HealthCheck ejecuta los chequeos y estandariza la respuesta:
  // 200 si todo está "up", 503 Service Unavailable si algo falla.
  @HealthCheck()
  @ApiOperation({ summary: 'Estado de salud de la API y sus dependencias' })
  @ApiOkResponse({
    description: 'API disponible y PostgreSQL respondiendo',
  })
  check() {
    return this.health.check([
      // 'database': nombre del indicador en la respuesta.
      // pingCheck falla si la BD no contesta en el timeout (1.5s).
      () => this.db.pingCheck('database', { timeout: 1500 }),
    ]);
  }
}
