# Product Catalog API

API REST para administrar un catálogo de productos con categorías, construida como prueba técnica Backend. Incluye CRUD completo, listado con paginación/búsqueda/filtros/ordenamiento resueltos en PostgreSQL, estadísticas para dashboard, eliminación lógica, seguridad básica, observabilidad y despliegue completo con Docker.

## Tecnologías

- **NestJS 11** + **TypeScript** (modo estricto)
- **PostgreSQL 16** + **TypeORM 0.3** (migraciones, sin `synchronize`)
- **class-validator / class-transformer** para validación de DTOs
- **Swagger** (OpenAPI) para documentación interactiva
- **Helmet** + **@nestjs/throttler** (rate limiting) para seguridad básica
- **@nestjs/terminus** para health checks
- **Docker / Docker Compose** (imagen multietapa, usuario no privilegiado)

## Ejecución rápida con Docker (recomendada)

Único requisito: Docker Desktop instalado.

```bash
git clone <url-del-repositorio>
cd product-catalog-api
docker compose up --build
```

Ese único comando levanta PostgreSQL, ejecuta las migraciones, carga el seed de datos y arranca la API. Sin pasos manuales adicionales.

Al terminar el arranque:

| Recurso | URL |
|---|---|
| API | http://localhost:3010/api/v1 |
| Documentación Swagger | http://localhost:3010/api/docs |
| Health check | http://localhost:3010/api/v1/health |

Para detener: `Ctrl+C` (o `docker compose down`). Para reiniciar desde cero, borrando datos: `docker compose down -v && docker compose up --build`.

> **Nota para el frontend:** CORS está habilitado para `http://localhost:3000`. El seed carga 4 categorías y 12 productos de demostración (9 activos, 3 inactivos; la categoría "Libros" queda vacía a propósito para probar el dashboard con conteo cero).

## Instalación y ejecución local (desarrollo)

Requisitos: Node.js 20.x, npm, Docker (solo para PostgreSQL).

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env

# 3. Base de datos
docker compose up -d db

# 4. Migraciones y datos de prueba
npm run migration:run
npm run seed

# 5. Arrancar en modo desarrollo (recarga automática)
npm run start:dev
```

## Variables de entorno

Definidas en `.env` (ver `.env.example`):

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto de la API | `3010` |
| `DB_HOST` | Host de PostgreSQL | `localhost` (en Docker: `db`) |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario de la BD | `postgres` |
| `DB_PASSWORD` | Contraseña de la BD | `postgres` |
| `DB_DATABASE` | Nombre de la BD | `product_catalog` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:3000` |

## Migraciones

El esquema se gestiona exclusivamente con migraciones de TypeORM (`synchronize: false`).

```bash
npm run migration:run        # aplicar pendientes
npm run migration:revert     # revertir la última
npm run migration:generate -- src/common/database/migrations/NombreDelCambio   # generar a partir de cambios en entidades
```

En Docker, las migraciones se ejecutan automáticamente al arrancar el contenedor de la API.

## Seed

```bash
npm run seed
```

El seed es **idempotente**: puede ejecutarse múltiples veces sin duplicar información (usa el `slug` de categorías y el `name` de productos como claves naturales). En Docker se ejecuta automáticamente en cada arranque.

## Endpoints

Prefijo global: `/api/v1`. Documentación completa con ejemplos en Swagger: http://localhost:3010/api/docs

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/products` | Listado paginado con búsqueda, filtros y ordenamiento |
| GET | `/products/stats` | Estadísticas para dashboard (totales y desglose por categoría) |
| GET | `/products/:id` | Detalle de un producto |
| POST | `/products` | Crear producto |
| PATCH | `/products/:id` | Actualización parcial |
| DELETE | `/products/:id` | Eliminación lógica (204) |
| GET | `/categories` | Listar categorías |
| GET | `/categories/:id` | Detalle de categoría |
| POST | `/categories` | Crear categoría |
| PATCH | `/categories/:id` | Actualizar categoría |
| DELETE | `/categories/:id` | Eliminar categoría (204) |
| GET | `/health` | Estado de la API y PostgreSQL |

### Parámetros del listado de productos

`GET /api/v1/products?page=1&limit=10&search=laptop&categoryId=<uuid>&status=ACTIVE&sortBy=price&sortOrder=asc`

Todos opcionales y combinables. `page` ≥ 1 (default 1), `limit` 1–100 (default 10), `search` busca por nombre sin distinguir mayúsculas, `status` admite `ACTIVE`/`INACTIVE`, `sortBy` admite `name`/`price`, `sortOrder` admite `asc`/`desc`. La respuesta incluye `data` y `meta` (`total`, `page`, `limit`, `totalPages`).

### Formato uniforme de errores

Toda respuesta de error sigue la misma estructura:

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "Producto con id ... no encontrado",
  "path": "/api/v1/products/...",
  "timestamp": "2026-07-22T15:30:00.000Z"
}
```

Códigos usados: `VALIDATION_ERROR` (400), `PRODUCT_NOT_FOUND` / `CATEGORY_NOT_FOUND` (404), `CONFLICT` (409), `TOO_MANY_REQUESTS` (429), `INTERNAL_SERVER_ERROR` (500). Los errores internos (incluidos los de PostgreSQL) nunca se exponen al cliente; se registran solo en el servidor.

## Pruebas

```bash
npm run test        # unitarias
npm run test:e2e    # end-to-end (requiere PostgreSQL: docker compose up -d db)
```

## Decisiones técnicas

**Filtrado, ordenamiento y paginación en PostgreSQL.** El listado nunca carga la tabla en memoria: los filtros se traducen a `WHERE` parametrizados, la búsqueda usa `ILIKE` (índice en `name`) y la paginación usa `LIMIT/OFFSET`. Los campos de ordenamiento se validan contra lista blanca en el DTO porque `ORDER BY` no admite parámetros — previene inyección SQL. La solución escala con volúmenes grandes de datos.

**Eliminación lógica (`deletedAt`).** Los productos no se borran físicamente: `softRemove` marca la fecha en `deletedAt` y TypeORM excluye automáticamente esos registros de todas las consultas. Se conserva trazabilidad e integridad referencial histórica. Costo aceptado: la tabla crece con registros inactivos.

**Imágenes por URL.** No se implementa almacenamiento físico de archivos (fuera del alcance de la prueba): el producto guarda `imageUrl` validada como URL http/https. En producción se integraría un object storage (S3 o similar) y el campo pasaría a apuntar a ese recurso.

**Categoría como entidad relacionada (1:N).** La categoría no es un string dentro del producto: es tabla propia con FK y `onDelete: RESTRICT` (no se puede borrar una categoría con productos). El listado hace JOIN para incluirla en la respuesta y evitar una segunda petición del frontend.

**Estadísticas con categorías vacías.** `/products/stats` incluye categorías con `count: 0` (acordado con el frontend para consistencia del dashboard). Se resuelve con `LEFT JOIN` desde categorías y agregación condicional (`COUNT(CASE WHEN ...)`) para el desglose activo/inactivo por categoría en una sola consulta.

**Precio como `numeric(12,2)`.** Evita errores de redondeo de flotantes. PostgreSQL devuelve `numeric` como string; un transformer en la entidad lo convierte a `number` para que la API responda valores numéricos.

**Seguridad básica.** Helmet (cabeceras de seguridad), CORS restringido al origen del frontend, `ValidationPipe` global con whitelist estricta (propiedades no declaradas → 400) y rate limiting de 60 solicitudes/minuto por cliente (429 al exceder; el health check está excluido para no bloquear monitoreo). No se implementa autenticación por no estar solicitada en la prueba.

**Observabilidad.** Interceptor global de logging (`GET /api/v1/products?page=1 200 35ms` — nunca registra cuerpos ni datos sensibles; los logs van a stdout siguiendo twelve-factor y los captura Docker) y health check con Terminus que verifica la API y la conexión a PostgreSQL (200 sano / 503 degradado).

**Docker multietapa.** La imagen final solo contiene JavaScript compilado y dependencias de producción (sin TypeScript, Jest ni ESLint), corre con usuario no privilegiado y expone el puerto 3010. El arranque ejecuta migraciones → seed → API; si las migraciones fallan, el contenedor no arranca. `depends_on` con healthcheck de PostgreSQL evita condiciones de carrera al iniciar.

## Supuestos realizados

- No se requiere autenticación ni autorización (no solicitadas en la prueba).
- El estado del producto es un enum (`ACTIVE`/`INACTIVE`) extensible, no un boolean; el frontend mapea a su representación interna.
- Las estadísticas incluyen categorías sin productos, acordado con el equipo frontend.
- Los datos del seed son de demostración; en un entorno real el seed solo cargaría catálogos base.
- La API se consume desde un único frontend conocido (`FRONTEND_URL`); CORS se restringe a ese origen.
