# Backend: arquitectura y stack tecnológico de Tandem

## 1. Propósito
Este documento define el stack tecnológico y la arquitectura del backend de **Tandem**: el servicio que expone la API y la lógica de negocio del dominio descrito en [docs/prd.md](prd.md) y [docs/modelo-datos.md](modelo-datos.md). Sirve como referencia técnica para el desarrollo, independientemente del proveedor de hosting final.

## 2. Stack tecnológico

| Capa | Elección | Versión fijada | Justificación |
|------|----------|-----------------|----------------|
| Lenguaje | TypeScript | 6.0.x | Tipado fuerte, ecosistema maduro, facilita validar la estructura dinámica de `form_data`. |
| Runtime | Node.js | 24.x (LTS) | Estándar de facto para TypeScript en backend; LTS con soporte hasta abril de 2027. |
| Framework | NestJS | 11.x | Estructura modular con inyección de dependencias, encaja bien con dominios ricos como el de Tandem (Workstream, Deliverable, Requirement, TechnicalAnalysis, WorkItem...). |
| Base de datos | PostgreSQL | 18.x | Soporta JSONB (para `form_data`), fuerte en integridad relacional, madura para un dominio con muchas relaciones. |
| ORM / migraciones | Prisma | 7.x | Migraciones versionadas, cliente tipado a partir del esquema, buen encaje con TypeScript + PostgreSQL. |
| Identificadores | `ulid` (npm) | ^3.0.x | Generados en la aplicación, `char(26)`, ordenables por tiempo de creación, consistente con el modelo de datos ([docs/modelo-datos.md](modelo-datos.md)). |
| Autenticación | `@nestjs/jwt` + `argon2` | `@nestjs/jwt` ^11.x, `argon2` ^0.44.x | JWT (access + refresh token) para sesión stateless; contraseñas con Argon2, adecuado para un cliente de escritorio que mantiene el token en Keychain. |
| Autorización | Guards de NestJS derivando permisos del array `roles` del `User` | — | No existe entidad de roles independiente; los permisos se calculan directamente de los roles acumulados del usuario (ver modelo de datos §3.1). |
| Validación | `class-validator` / `class-transformer` | ^0.15.x / ^0.5.x | Integración nativa con NestJS (DTOs) para validar payloads y el contenido dinámico de formularios. |
| Documentación de API | `@nestjs/swagger` | ^11.x | Genera el OpenAPI que sirve de contrato para el cliente Swift del frontend ([docs/frontend.md](frontend.md)) vía `swift-openapi-generator`. |
| Testing | Jest + Supertest | Jest ^30.x, Supertest ^7.x | Estándar en el ecosistema Nest/TypeScript. |
| Contenedores | Docker + Docker Compose | Docker Engine ≥ 26, Compose v2 | Entorno de desarrollo reproducible; despliegue agnóstico de proveedor mientras no se decida el hosting. |
| Gestor de paquetes | pnpm | 11.x | Instalaciones más rápidas y eficientes en disco que npm/yarn para el tamaño de proyecto esperado. |
| Lint / formato | ESLint + Prettier | ESLint ^10.x (flat config), Prettier ^3.x | Consistencia de estilo. |
| Almacenamiento de adjuntos | Interfaz de storage abstracta (adapter local en desarrollo, compatible S3 en producción) | — | Permite no atarse a un proveedor de object storage hasta decidir el hosting. |
| CQRS / eventos de dominio | `@nestjs/cqrs` | ^11.x | Command/query/event bus para el núcleo del dominio (ver §3). |
| CI/CD | GitHub Actions | — | Ver §9. |
| Hosting / despliegue | **Pendiente de decisión** | — | Se evaluará como su propio change de openspec cuando corresponda; el backend se diseña containerizado para no acoplarse a un proveedor concreto. |

> Las versiones fijadas son las vigentes a la fecha de este documento. Cualquier actualización (major o minor con cambios relevantes) debe hacerse mediante un change de openspec explícito, no de forma incidental dentro de otro cambio.

## 3. Arquitectura: DDD ligero + CQRS en el núcleo, capas simples en el resto
No se aplica hexagonal/DDD estricto a todos los módulos por igual: la mayoría de entidades del modelo de datos son esencialmente CRUD y forzar puertos/adaptadores ahí solo añadiría indirección sin beneficio. En cambio, hay un subconjunto de entidades con una máquina de estados y varias invariantes no triviales (ver [docs/modelo-datos.md](modelo-datos.md) §5) donde sí merece la pena proteger las reglas de negocio dentro de entidades ricas, aisladas de HTTP y de Prisma.

### 3.1 Núcleo del dominio (DDD ligero + CQRS)
Módulos: `DeliverablesModule`, `RequirementsModule` (incluye `WorkItemRequirement`), `TechnicalAnalysesModule`, `WorkItemsModule`, `BlockersModule`.

- **Entidades ricas**: encapsulan sus propias invariantes y transiciones de estado (p. ej. `Deliverable.markReadyForReview()`, `TechnicalAnalysis.approve()`, `WorkItem.publish()`); no hay setters libres que permitan estados inconsistentes.
- **CQRS con `@nestjs/cqrs`**: cada transición del flujo se modela como un comando explícito (`MarkDeliverableReadyForReviewCommand`, `ApproveDeliverableCommand`, `BlockDeliverableCommand`, `AssignDeliverableCommand`, `SubmitTechnicalAnalysisCommand`, `ApproveTechnicalAnalysisCommand`, `RequestTechnicalAnalysisChangesCommand`, `CreateDraftWorkItemCommand`...), gestionado por un `CommandHandler` que carga el agregado vía su repositorio, invoca el método de dominio correspondiente y persiste el resultado. Las lecturas (listados, detalle, board Kanban) se resuelven como `Query`/`QueryHandler` independientes, sin pasar por los agregados de escritura.
- **Puertos y adaptadores solo aquí**: cada agregado define una interfaz de repositorio (puerto) en su capa de dominio; la implementación con Prisma vive en infraestructura. Esto permite testear las reglas de negocio (los 12 puntos de [docs/modelo-datos.md](modelo-datos.md) §5) sin levantar base de datos.
- **Eventos de dominio**: transiciones relevantes emiten eventos (`DeliverableBlockedEvent`, `TechnicalAnalysisApprovedEvent`, `WorkItemPublishedEvent`...) a través del `EventBus` de `@nestjs/cqrs`. Módulos de soporte como `NotificationsModule` se suscriben a estos eventos para generar notificaciones, sin que el núcleo conozca su existencia (desacopla el "qué pasó" del "quién debe enterarse").

### 3.2 Módulos de soporte (capas simples)
Módulos: `AuthModule`, `UsersModule`, `WorkstreamsModule`, `RequirementTypesModule`, `FormsModule`, `WorkItemTypesModule`, `CommentsModule`, `AttachmentsModule`, `NotificationsModule`, `SearchModule`.

Siguen el patrón estándar de NestJS: `Controller` → `Service` → acceso directo a Prisma (sin capa de dominio ni repositorio propio). Son entidades sin máquina de estados relevante; añadir DDD/hexagonal aquí sería sobre-ingeniería para el alcance del MVP.

> Regla práctica para nuevos módulos: si la entidad tiene una transición de estado con invariantes que puedan violarse (como las de §6), va al núcleo con DDD ligero + CQRS; si es esencialmente CRUD, va a soporte con el patrón simple. Ante la duda, empezar simple y migrar al núcleo solo si aparecen invariantes reales.

## 4. Persistencia
- Cada entidad de [docs/modelo-datos.md](modelo-datos.md) §3 se modela como tabla en `schema.prisma`, con `id` (ULID), `created_at`, `updated_at` (y `deleted_at` si se adopta soft delete).
- `form_data` se almacena como columna `JSONB`; su validación contra los `FormField` del `Form` asociado ocurre en la capa de aplicación, no como constraint de base de datos.
- En los módulos del núcleo (§3.1), el acceso a datos pasa por el puerto de repositorio del agregado (implementado con Prisma en infraestructura); en los módulos de soporte (§3.2), el `Service` usa `PrismaService` directamente.
- Las migraciones se gestionan con Prisma Migrate y se versionan en el repositorio.

## 5. API
- Estilo REST, recursos alineados a las entidades del dominio (`/api/v1/workstreams`, `/api/v1/deliverables`, `/api/v1/work-items`, etc.).
- Autenticación mediante Bearer JWT en el header `Authorization`; refresh tokens rotativos con revocación.
- La especificación OpenAPI generada automáticamente es el contrato entre backend y el cliente Swift del frontend.

## 6. Reglas de negocio del núcleo
Las transiciones de estado y reglas de [docs/modelo-datos.md](modelo-datos.md) §5 se implementan dentro de las entidades de dominio del núcleo (§3.1) y se disparan a través de sus `CommandHandler`, no en controllers ni como simples constraints de BD:
- Un `WorkItem` pertenece exactamente a un `Deliverable` o a un `Workstream`, nunca a ambos ni a ninguno.
- `Deliverable` solo pasa a `ready_for_review` con todos sus `Requirement` en `is_completed = true`.
- Solo un usuario con rol `team_lead` puede aprobar `ready_for_development` o bloquear con comentarios.
- `in_technical_analysis` requiere al menos un `assignee` y un `reviewer` asignados.
- Solo un `reviewer_id` del `Deliverable` puede aprobar o solicitar cambios sobre su `TechnicalAnalysis`.
- Los `WorkItem` en `draft` solo existen mientras el `TechnicalAnalysis` no está `approved`, y siempre deben tener ≥1 `Requirement` asociado vía `WorkItemRequirement`.
- Al aprobarse el `TechnicalAnalysis`, todos los `WorkItem` `draft` del `Deliverable` transicionan automáticamente a `to_do` (orquestado por el `CommandHandler` de `ApproveTechnicalAnalysisCommand`, reaccionando al agregado `TechnicalAnalysis` aprobado).
- Un `WorkItem` no puede pasar a `done` con `FormField` obligatorios de su `WorkItemType` sin completar.
- Un `Blocker` abierto asociado fuerza el status `blocked` en su entidad.

La autorización basada en rol (p. ej. "solo `team_lead`", "solo un `reviewer_id` del Deliverable") se valida en el `CommandHandler` antes de invocar el método de dominio, no dentro de la entidad, para mantener el dominio libre de dependencias de sesión/autenticación.

## 7. Notificaciones y tiempo real
- MVP: las `Notification` se generan reaccionando a los eventos de dominio del núcleo (`DeliverableBlockedEvent`, `TechnicalAnalysisApprovedEvent`, etc. — ver §3.1) mediante un `EventHandler` en `NotificationsModule`, y se consultan vía REST (pull/polling desde el cliente).
- Evolución futura (fuera de alcance MVP): push en tiempo real del board Kanban vía WebSocket (`@nestjs/websockets`), suscrito a los mismos eventos de dominio.

## 8. Testing y calidad
- Núcleo (§3.1): tests unitarios de las entidades de dominio (reglas de §6) sin infraestructura, y tests de los `CommandHandler`/`QueryHandler` con el repositorio en memoria o mockeado.
- Soporte (§3.2): tests unitarios por servicio (Jest).
- Tests e2e (Supertest) cubriendo los flujos críticos de extremo a extremo: revisión funcional del Tech Lead, ciclo de análisis técnico, publicación automática de work items en borrador.

## 9. CI/CD: GitHub Actions
El repositorio usa **GitHub Actions** como proveedor de CI. Workflow propuesto (`.github/workflows/backend-ci.yml`), disparado en push/PR sobre rutas de `backend/`:

1. Checkout del repo (`actions/checkout@v4`).
2. Setup de Node.js 22.x (`actions/setup-node@v4`) con caché de pnpm.
3. Instalación de dependencias (`pnpm install --frozen-lockfile`).
4. Lint (`pnpm lint`) y chequeo de tipos (`tsc --noEmit`).
5. Tests unitarios y e2e (`pnpm test`, `pnpm test:e2e`) contra un servicio de PostgreSQL 17 levantado como `services:` del job.
6. (En rama principal) build y push de la imagen Docker a un registro de contenedores, como paso previo a un despliegue que se definirá junto con el hosting.

El despliegue efectivo (CD) a un entorno concreto queda pendiente hasta decidir el proveedor de hosting (§11); el workflow de CI es independiente de esa decisión.

## 10. Estructura de carpetas propuesta
```
backend/
  src/
    core/                       # DDD ligero + CQRS (§3.1)
      deliverables/
        domain/                # entidad Deliverable, value objects, eventos, puerto del repositorio
        application/            # command handlers, query handlers
        infrastructure/         # repositorio Prisma (adaptador), mappers
        interface/               # controller, DTOs de la API
      requirements/              # Requirement + WorkItemRequirement
        domain/
        application/
        infrastructure/
        interface/
      technical-analyses/
        domain/
        application/
        infrastructure/
        interface/
      work-items/
        domain/
        application/
        infrastructure/
        interface/
      blockers/
        domain/
        application/
        infrastructure/
        interface/
    modules/                    # capas simples, Controller -> Service -> Prisma (§3.2)
      auth/
      users/
      workstreams/
      requirement-types/
      forms/
      work-item-types/
      comments/
      attachments/
      notifications/
      search/
    common/          # guards, decorators, filters, pipes
    prisma/          # schema.prisma, migrations
  test/
  docker-compose.yml
  Dockerfile
.github/
  workflows/
    backend-ci.yml
```

## 11. Pendiente de decisión
- Proveedor de hosting/infra (cloud gestionado vs self-hosted) — se decidirá como su propio change de openspec.
- Proveedor definitivo de almacenamiento de adjuntos (S3, GCS, MinIO, etc.) una vez definido el hosting.
- Necesidad de WebSockets para actualizaciones en tiempo real (evaluar después del MVP).
- CD (despliegue continuo) al entorno de hosting, una vez decidido el proveedor.
