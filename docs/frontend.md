# Frontend: arquitectura y stack tecnológico de Tandem (macOS)

## 1. Propósito
Este documento define el stack tecnológico y la arquitectura del frontend de **Tandem**: una aplicación de escritorio nativa para macOS que consume la API del backend ([docs/backend.md](backend.md)) y ofrece la experiencia de usuario para Product Owners, Developers, Team Leads/Reviewers y Administrators, según [docs/prd.md](prd.md).

## 2. Stack tecnológico

| Aspecto | Elección | Versión fijada | Justificación |
|---------|----------|-----------------|----------------|
| Lenguaje | Swift | 6.3 (language mode Swift 6) | Requisito del PRD de una app nativa de macOS con convenciones nativas (§10 Requisitos no funcionales). |
| Toolchain | Xcode | 26.x | Toolchain estable que soporta Swift 6.1 y el Observation framework. |
| UI | SwiftUI, con interoperabilidad AppKit puntual | SDK de macOS 14+ | Máxima fidelidad a las convenciones de macOS (menús, atajos, `NavigationSplitView`, toolbars); AppKit se usa donde SwiftUI aún no cubre bien un comportamiento (p. ej. ciertos detalles de drag & drop o `NSToolbar`). |
| Arquitectura | MVVM con `@Observable` (Observation framework) | — (parte del SDK) | Separación clara entre vistas y lógica de presentación; encaja de forma nativa con SwiftUI. |
| Concurrencia | Swift Concurrency (`async/await`, actors) | — (parte del lenguaje) | Estándar moderno de Swift para llamadas a la API sin bloquear la UI. |
| Networking | `URLSession` + cliente generado con `swift-openapi-generator` | `swift-openapi-generator` ^1.12.x, `swift-openapi-runtime` ^1.12.x, `swift-openapi-urlsession` ^1.3.x | Mantiene el cliente sincronizado con el contrato OpenAPI del backend y evita mantener modelos a mano. |
| Persistencia local / caché | SwiftData | — (parte del SDK, macOS 14+) | Caché local de datos consultados con frecuencia (árbol de Workstreams/Deliverables, board Kanban) para una experiencia ágil; no se implementa modo offline completo en el MVP. |
| Autenticación | Tokens JWT (access + refresh) almacenados en Keychain | — (API del sistema) | Almacenamiento seguro estándar de macOS para credenciales/tokens. |
| Testing | Swift Testing (unitarios) + XCTest UI Testing | Swift Testing incluido en Swift 6.3; XCTest incluido en Xcode 16.x | Swift Testing es el framework moderno recomendado por Apple; XCTest se mantiene para UI tests. |
| Lint | SwiftLint | 0.65.x | Consistencia de estilo. |
| Distribución | Firma con Developer ID + notarización, distribución directa (fuera de Mac App Store) | — | Es una herramienta interna de equipo, no un producto de consumo; evita restricciones de sandboxing del App Store. Revisable si en el futuro se distribuye más ampliamente. |
| Requisito mínimo de SO | macOS 14 (Sonoma) o superior | — | Necesario para el Observation framework (`@Observable`) y APIs recientes de SwiftUI. |
| CI/CD | GitHub Actions | — | Ver §7. |

> Las versiones fijadas son las vigentes a la fecha de este documento. Cualquier actualización (de Swift, Xcode o del target mínimo de macOS) debe hacerse mediante un change de openspec explícito, no de forma incidental dentro de otro cambio.

## 3. Arquitectura de la app
- **Patrón MVVM**: `View` (SwiftUI) → `ViewModel` (`@Observable`, orquesta casos de uso) → `Service`/`Repository` (cliente API generado) → `Model` (`Codable`, alineado al esquema OpenAPI del backend).
- **Navegación**: `NavigationSplitView` de tres columnas — sidebar de Workstreams, lista de Deliverables/Work Items, panel de detalle — siguiendo el patrón habitual de apps nativas de macOS (Mail, Notas, Xcode).
- **Sesión**: un `SessionStore` observable, inyectado vía `Environment`, gestiona el token JWT, su renovación y el usuario autenticado.

## 4. Mapeo de pantallas principales
Basado en las user stories del PRD (§8) y las entidades del modelo de datos:

| Pantalla | Contenido / responsabilidad |
|----------|------------------------------|
| Sidebar | Listado de `Workstream`, con búsqueda y filtros. |
| Detalle de Workstream | `Deliverable` y `WorkItem` directos que contiene. |
| Detalle de Deliverable | Requisitos funcionales (formularios dinámicos por `RequirementType`/`Form`), indicador visual del estado del flujo (requisitos → revisión funcional → análisis técnico → en progreso), comentarios, adjuntos, bloqueos. |
| Detalle de TechnicalAnalysis | Contenido del análisis, estado de revisión, work items en borrador asociados. |
| Board Kanban | `WorkItem` organizados por estado (`to_do`, `in_progress`, `blocked`, `done`) con drag & drop nativo (`Transferable` / `onDrop`). |
| Roadmap | `Deliverable` como hitos, usando `start_date`/`target_date`. |
| Administración | Gestión de usuarios y roles, tipos de requisito/work item y sus formularios (rol Administrator). |

## 5. Formularios dinámicos
Los formularios de `Requirement` y `WorkItem` se renderizan dinámicamente a partir del array de `FormField` que devuelve la API. Cada `field_type` mapea a un componente SwiftUI reutilizable:

| `field_type` | Componente SwiftUI |
|---|---|
| `text` | `TextField` |
| `textarea` | `TextEditor` |
| `number` | `TextField` numérico / `Stepper` |
| `boolean` | `Toggle` |
| `select` | `Picker` |
| `multi_select` | Selector de chips múltiple |
| `date` | `DatePicker` |
| `user_reference` | Selector de usuario (búsqueda + lista) |

## 6. Testing y calidad
- Unit tests de `ViewModel` con Swift Testing.
- UI tests de flujos críticos (crear Workstream, ciclo completo de un Deliverable, mover un WorkItem en el board) con XCTest UI Testing.
- SwiftLint integrado en el flujo de desarrollo.

## 7. CI/CD: GitHub Actions
El repositorio usa **GitHub Actions** como proveedor de CI, con un runner `macos-latest` (o el que soporte Xcode 16.x). Workflow propuesto (`.github/workflows/frontend-ci.yml`), disparado en push/PR sobre rutas de `frontend/`:

1. Checkout del repo (`actions/checkout@v4`).
2. Selección de la versión de Xcode requerida (`xcode-select`/`maxim-lobanov/setup-xcode@v1` fijando 16.x).
3. Lint con SwiftLint.
4. Build y tests unitarios/UI con `xcodebuild test` sobre el esquema de la app.
5. (En rama principal, cuando aplique) build de release firmado con Developer ID y notarización, como paso previo a la distribución.

## 8. Estructura de carpetas propuesta
```
frontend/
  TandemApp/
    App/                  # entry point, DI, sesión
    Features/
      Workstreams/
      Deliverables/
      Requirements/
      TechnicalAnalysis/
      WorkItems/
      Board/
      Roadmap/
      Admin/
    Networking/            # cliente generado (OpenAPI) + servicios
    Models/
    Common/                 # componentes UI reutilizables, extensions
  TandemAppTests/
  TandemAppUITests/
.github/
  workflows/
    frontend-ci.yml
```

## 9. Pendiente de decisión
- Estrategia de distribución final si en el futuro se amplía a más organizaciones (Developer ID directo vs Mac App Store).
- Alcance de soporte offline más allá de la caché local (fuera de alcance del MVP).
