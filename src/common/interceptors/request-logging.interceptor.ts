import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * RequestLoggingInterceptor
 *
 * Responsabilidad: registrar cada solicitud HTTP con método, URL,
 * código de respuesta y duración, en el formato:
 *   GET /api/v1/products?page=1 200 35ms
 *
 * No registra cuerpos, cabeceras ni datos sensibles: solo la línea
 * de la solicitud (requisito de la prueba).
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  // Logger de NestJS con contexto 'HTTP': las líneas salen
  // etiquetadas y con timestamp, integradas al log estándar de Nest.
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl } = request;

    // Marca de inicio: la duración se mide desde que entra la
    // solicitud hasta que el handler emite la respuesta.
    const startedAt = Date.now();

    return next.handle().pipe(
      // tap observa el flujo sin modificarlo: la respuesta pasa
      // intacta al cliente. next se ejecuta en éxito y error en fallo.
      tap({
        next: () => {
          const elapsed = Date.now() - startedAt;
          this.logger.log(
            `${method} ${originalUrl} ${response.statusCode} ${elapsed}ms`,
          );
        },
        error: (error: Error & { status?: number }) => {
          const elapsed = Date.now() - startedAt;
          // En errores, el status viene de la excepción (404, 400...);
          // 500 si es un error no controlado.
          const statusCode = error.status ?? 500;
          this.logger.warn(
            `${method} ${originalUrl} ${statusCode} ${elapsed}ms`,
          );
        },
      }),
    );
  }
}
