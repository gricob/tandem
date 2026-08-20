# Backend: arquitectura y stack tecnológico de Tandem

## 1. Propósito
Este documento define el stack tecnológico y la arquitectura del backend de **Tandem**: el servicio que expone la API y la lógica de negocio del dominio descrito en [docs/prd.md](prd.md) y [docs/modelo-datos.md](modelo-datos.md). Sirve como referencia técnica para el desarrollo, independientemente del proveedor de hosting final.

## 2. Stack tecnológico

| Capa | Elección | Versión fijada | Justificación |
|------|----------|-----------------|----------------|
| Lenguaje | TypeScript | 6.0.x | Tipado fuerte, ecosistema maduro, facilita validar la estructura dinámica de `response_data`. |
| Runtime | Node.js | 24.x (LTS) | Estándar de facto para TypeScript en backend; LTS con soporte hasta abril de 2027. |
| Framework | NestJS | 11.x | Estructura modular con inyección de dependencias; el dominio de Tandem (FormType, FormField, Form, FormResponse) es esencialmente CRUD, para el que Nest ofrece una estructura simple y suficiente. |
| Base de datos | PostgreSQL | 18.x | Soporta JSONB (para `response_data` y `options`), fuerte en integridad relacional. |
| ORM / migraciones | Prisma | 7.x | Migraciones versionadas, cliente tipado a partir del esquema, buen encaje con TypeScript + PostgreSQL. |
| Identificadores | `ulid` (npm) | ^3.0.x | Generados en la aplicación, `char(26)`, ordenables por tiempo de creación, consistente con el modelo de datos ([docs/modelo-datos.md](modelo-datos.md)). |
| Validación | `class-validator` / `class-transformer` | ^0.15.x / ^0.5.x | Integración nativa con NestJS (DTOs) para validar payloads y el contenido dinámico de respuestas. |
| Documentación de API | `@nestjs/swagger` | ^11.x | Genera el OpenAPI que sirve de contrato para el cliente TypeScript del frontend web ([docs/frontend.md](frontend.md)), generado con `openapi-typescript`. |
| Autenticación | `@nestjs/jwt` | ^11.x | Emite y valida el token de sesión tras validar la contraseña compartida (ver §5); evita reenviar la contraseña en cada petición. |
| Testing | Jest + Supertest | Jest ^30.x, Supertest ^7.x | Estándar en el ecosistema Nest/TypeScript. |
| Contenedores | Docker + Docker Compose | Docker Engine ≥ 26, Compose v2 | Entorno de desarrollo reproducible; despliegue agnóstico de proveedor mientras no se decida el hosting. |
| Gestor de paquetes | pnpm | 11.x | Instalaciones más rápidas y eficientes en disco que npm/yarn para el tamaño de proyecto esperado. |
| Lint / formato | ESLint + Prettier | ESLint ^10.x (flat config), Prettier ^3.x | Consistencia de estilo. |
| CI/CD | GitHub Actions | — | Ver §8. |
| Hosting / despliegue | **Pendiente de decisión** | — | Se evaluará como su propio change de openspec cuando corresponda; el backend se diseña containerizado para no acoplarse a un proveedor concreto. |

> Las versiones fijadas son las vigentes a la fecha de este documento. Cualquier actualización (major o minor con cambios relevantes) debe hacerse mediante un change de openspec explícito, no de forma incidental dentro de otro cambio.

> No hay autenticación real de usuarios ni autorización por roles: todos los endpoints comparten el mismo nivel de acceso (ver [docs/prd.md](prd.md) §12). Desde el MVP, toda la API (salvo el propio endpoint de login) requiere una contraseña general compartida en lugar de autenticación real (ver §5); esta última se abordará como su propio change de openspec si en el futuro se necesita distinguir usuarios.

## 3. Arquitectura: capas simples (Controller → Service → Prisma)
El dominio de Tandem es esencialmente CRUD, sin máquina de estados ni reglas de negocio complejas. Por eso todos los módulos siguen el mismo patrón simple de NestJS: `Controller` → `Service` → acceso directo a Prisma, sin capa de dominio ni repositorio propio.

Módulos: `FormTypesModule`, `FormFieldsModule`, `FormsModule`, `FormResponsesModule`.

> Regla práctica: si en el futuro aparecen reglas de negocio no triviales (por ejemplo, si se reintroducen cuentas de usuario con permisos), evaluar entonces introducir una capa de dominio o de autorización explícita solo donde se necesite; no anticiparla mientras el dominio siga siendo CRUD abierto.

## 4. Persistencia
- Cada entidad de [docs/modelo-datos.md](modelo-datos.md) §3 se modela como tabla en `schema.prisma`, con `id` (ULID), `created_at`, `updated_at` (y `deleted_at` si se adopta soft delete).
- `response_data` (en `FormResponse`) y `options` (en `FormField`) se almacenan como columnas `JSONB`; la validación de `response_data` contra los `FormField` del `FormType` asociado al `Form` correspondiente ocurre en la capa de aplicación (`FormResponsesModule`), no como constraint de base de datos.
- El `Service` de cada módulo usa `PrismaService` directamente.
- Las migraciones se gestionan con Prisma Migrate y se versionan en el repositorio.

## 5. API
- Estilo REST, recursos alineados a las entidades del dominio:
  - `/api/v1/form-types`
  - `/api/v1/form-types/:formTypeId/fields`
  - `/api/v1/forms`
  - `/api/v1/forms/:formId/response` (recurso singular: un Form admite como máximo una FormResponse; `PUT` funciona como upsert para crearla o editarla)
  - `/api/v1/auth/login` (único endpoint público; recibe la contraseña compartida y devuelve el token de sesión)
- Autenticación por contraseña compartida: no hay usuarios ni permisos diferenciados, pero toda la API (excepto `POST /api/v1/auth/login`) exige un token de sesión válido.
  1. El frontend envía la contraseña introducida por el usuario a `POST /api/v1/auth/login`.
  2. El backend la compara contra la variable de entorno `APP_PASSWORD` y, si coincide, devuelve un token firmado con `@nestjs/jwt` (secreto en `APP_JWT_SECRET`); no distingue usuarios, por lo que no necesita expiración corta.
  3. El frontend adjunta el token en cada petición posterior vía cabecera `Authorization: Bearer <token>`.
  4. Un `AuthGuard` global de NestJS valida el token en todos los endpoints salvo el de login; una petición sin token o con token inválido responde `401`.
- CORS habilitado para el/los origen(es) del frontend web (configurable por entorno).
- La especificación OpenAPI generada automáticamente es el contrato entre backend y el cliente TypeScript del frontend web ([docs/frontend.md](frontend.md)).

## 6. Reglas de negocio
Implementada en el `Service` de `FormResponsesModule` (ver [docs/modelo-datos.md](modelo-datos.md) §5):
- Un `Form` solo tiene una `FormResponse`: guardarla es una operación de upsert sobre ese mismo recurso (se crea en el primer guardado, se actualiza en los siguientes), sin crear filas nuevas ni bloquear guardados posteriores.
- `response_data` se puede guardar de forma incremental, sin necesidad de incluir un valor para cada `FormField` con `is_required = true` en cada guardado; esa validación determina si la respuesta se considera completa, no si el guardado se acepta.

## 7. Testing y calidad
- Tests unitarios por servicio (Jest), cubriendo especialmente la validación de campos obligatorios (§6).
- Tests e2e (Supertest) cubriendo los flujos críticos de extremo a extremo: creación de un tipo de formulario, creación de un formulario a partir de él, guardado incremental y edición posterior de la respuesta, y consulta de la respuesta.

## 8. CI/CD: GitHub Actions
El repositorio usa **GitHub Actions** como proveedor de CI. Workflow propuesto (`.github/workflows/backend-ci.yml`), disparado en push/PR sobre rutas de `backend/`:

1. Checkout del repo (`actions/checkout@v4`).
2. Setup de Node.js 24.x (`actions/setup-node@v4`) con caché de pnpm.
3. Instalación de dependencias (`pnpm install --frozen-lockfile`).
4. Lint (`pnpm lint`) y chequeo de tipos (`tsc --noEmit`).
5. Tests unitarios y e2e (`pnpm test`, `pnpm test:e2e`) contra un servicio de PostgreSQL 18 levantado como `services:` del job.
6. (En rama principal) build y push de la imagen Docker a un registro de contenedores, como paso previo a un despliegue que se definirá junto con el hosting.

El despliegue efectivo (CD) a un entorno concreto queda pendiente hasta decidir el proveedor de hosting (§10); el workflow de CI es independiente de esa decisión.

## 9. Estructura de carpetas propuesta
```
backend/
  src/
    modules/
      form-types/
      form-fields/
      forms/
      form-responses/
    common/          # filters, pipes
    prisma/          # schema.prisma, migrations
  test/
  docker-compose.yml
  Dockerfile
.github/
  workflows/
    backend-ci.yml
```

## 10. Pendiente de decisión
- Proveedor de hosting/infra (cloud gestionado vs self-hosted) — se decidirá como su propio change de openspec.
