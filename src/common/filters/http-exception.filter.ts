import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Estructura uniforme de toda respuesta de error de la API.
 */
interface ErrorResponseBody {
  statusCode: number;
  code: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/**
 * HttpExceptionFilter
 *
 * Responsabilidad: capturar TODA excepción de la aplicación y
 * convertirla en una respuesta JSON uniforme:
 *   { statusCode, code, message, path, timestamp }
 *
 * - Excepciones HTTP de NestJS (400, 404, 409, 429...): se
 *   traducen conservando su status y mensaje.
 * - Cualquier otro error (TypeORM, bugs): responde 500 genérico
 *   SIN exponer detalles internos; el detalle real se loguea
 *   solo en el servidor.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  // Mapa status HTTP -> código de negocio por defecto.
  private static readonly DEFAULT_CODES: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
    [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
    [HttpStatus.CONFLICT]: 'CONFLICT',
    [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
  };

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      // Excepción controlada: respeta su status y su mensaje.
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      // getResponse() puede ser un string o un objeto con message
      // (el ValidationPipe envía un array de mensajes).
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const asRecord = body as Record<string, unknown>;
        message = (asRecord.message as string | string[]) ?? exception.message;
      }
    } else {
      // Error NO controlado (TypeORM, bug): nunca se expone el
      // detalle al cliente. Se loguea completo en el servidor
      // para poder diagnosticarlo.
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      statusCode,
      code: this.resolveCode(statusCode, request),
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  /**
   * Resuelve el código de negocio. Para 404 se especializa según
   * el recurso de la ruta: PRODUCT_NOT_FOUND / CATEGORY_NOT_FOUND.
   */
  private resolveCode(statusCode: number, request: Request): string {
    if (statusCode === Number(HttpStatus.NOT_FOUND)) {
      if (request.originalUrl.includes('/products')) {
        return 'PRODUCT_NOT_FOUND';
      }
      if (request.originalUrl.includes('/categories')) {
        return 'CATEGORY_NOT_FOUND';
      }
    }

    return HttpExceptionFilter.DEFAULT_CODES[statusCode] ?? 'UNEXPECTED_ERROR';
  }
}
