# Frontend: arquitectura y stack tecnológico de Tandem (Web)

## 1. Propósito
Este documento define el stack tecnológico y la arquitectura del frontend de **Tandem**: una aplicación web (SPA) que consume la API del backend ([docs/backend.md](backend.md)) y ofrece la experiencia de usuario para crear formularios, rellenarlos y consultar sus respuestas, según [docs/prd.md](prd.md).

## 2. Stack tecnológico

| Aspecto | Elección | Versión fijada | Justificación |
|---------|----------|-----------------|----------------|
| Lenguaje | TypeScript | 6.0.x | Misma versión que el backend (§2 de [docs/backend.md](backend.md)); tipado end-to-end compartido vía el contrato OpenAPI. |
| Framework UI | React | 19.x | Ecosistema maduro, gran disponibilidad de librerías (routing, data-fetching, componentes) y facilidad para encontrar talento. |
| Build tool / dev server | Vite | 7.x | Arranque y HMR rápidos, build de producción como assets estáticos sin necesidad de un runtime Node en producción. |
| Arquitectura de la app | SPA (client-side rendering), sin SSR | — | Tandem es una herramienta interna sin requisitos de SEO ni de rendimiento de primera carga tipo landing page; SSR (p. ej. Next.js) añadiría complejidad de despliegue (runtime Node/Edge) sin beneficio claro. |
| Routing | TanStack Router | ^1.x | Rutas y parámetros tipados end-to-end (alineado con el resto del stack tipado: Prisma, OpenAPI); evita bugs de rutas/params no tipados frente a alternativas como React Router. |
| Data fetching / caché de servidor | TanStack Query | ^5.x | Caché, deduplicación, invalidación y estados de loading/error sobre las llamadas a la API REST del backend; evita reimplementar esta lógica a mano en cada pantalla. |
| Cliente API | `fetch` + cliente tipado generado con `openapi-typescript` | `openapi-typescript` ^7.x | Mantiene los tipos del cliente sincronizados con el contrato OpenAPI del backend ([docs/backend.md](backend.md) §5); adjunta el token de sesión (§2) como cabecera `Authorization` en cada petición. |
| Componentes UI | Mantine | ^8.x | Biblioteca de componentes completa (formularios, fechas, notificaciones, layout) que acelera el desarrollo inicial frente a ensamblar primitivas sueltas; incluye buen soporte de accesibilidad y tema claro/oscuro de fábrica. |
| Formularios | `@mantine/form` + Zod (`mantine-form-zod-resolver`) | `@mantine/form` ^8.x, `zod` ^4.x | Integrado con Mantine; Zod valida el `response_data` dinámico definido por los `FormField` del backend antes de enviarlo a la API, y valida también el formulario de configuración de campos del builder. |
| Testing | Vitest + React Testing Library (unit/componentes), Playwright (e2e) | Vitest ^3.x, RTL ^16.x, Playwright ^1.5x.x | Vitest comparte configuración/transformación con Vite; Playwright cubre flujos críticos de extremo a extremo contra un navegador real. |
| Lint / formato | ESLint + Prettier | ESLint ^10.x (flat config), Prettier ^3.x | Mismas versiones que el backend ([docs/backend.md](backend.md) §2); permite compartir config base si el repo se organiza como monorepo. |
| Gestor de paquetes | pnpm | 11.x | Consistente con el backend; facilita un futuro monorepo con `pnpm workspaces`. |
| Distribución | Build estático (`vite build`) servido como assets estáticos | — | Sin runtime Node en producción; el hosting concreto queda pendiente de decisión (§9), coordinado con el hosting del backend ([docs/backend.md](backend.md) §10). |
| Navegadores soportados | Últimas 2 versiones de Chrome, Edge, Firefox y Safari (evergreen) | — | Herramienta interna de equipo; no se soportan navegadores legacy (p. ej. IE). |
| CI/CD | GitHub Actions | — | Ver §7. |

> Las versiones fijadas son las vigentes a la fecha de este documento. Cualquier actualización (major o minor con cambios relevantes) debe hacerse mediante un change de openspec explícito, no de forma incidental dentro de otro cambio.

> Hay una pantalla de contraseña simple (sin usuario, sin registro) que se muestra al entrar en la web si no hay una sesión válida: al introducir la contraseña general compartida, el frontend la envía a `POST /api/v1/auth/login`, guarda el token de sesión devuelto y lo adjunta a partir de ahí en cada llamada a la API (ver [docs/backend.md](backend.md) §5). No hay autenticación real de usuarios ni distinción de roles (ver [docs/prd.md](prd.md) §12).

## 3. Arquitectura de la app
- **Basada en componentes + hooks**: componentes de presentación (Mantine + propios) separados de la lógica de cada feature, que vive en hooks (`useForm`, `useCreateForm`, `useSubmitFormResponse`, etc.) que envuelven TanStack Query.
- **Estado de servidor vs. estado cliente**: todo dato que viene de la API se gestiona con TanStack Query (sin duplicarlo en estado local); el estado puramente de UI/cliente (el formulario en edición dentro del builder, el formulario en relleno, filtros de una lista) vive en el propio componente o feature con `useState`/`@mantine/form`.
- **Navegación**: layout simple de lista + detalle (listado de formularios a la izquierda o superior, panel de detalle/edición/relleno a la derecha o debajo) implementado con el sistema de grid de Mantine, con colapso responsive en viewports estrechos; el foco principal de uso es escritorio/laptop vía navegador, pero el layout no se rompe en tablet.

## 4. Mapeo de pantallas principales
Basado en las user stories del PRD (§8) y las entidades del modelo de datos:

| Pantalla | Contenido / responsabilidad |
|----------|------------------------------|
| Contraseña de acceso | Formulario mínimo (un único campo de contraseña) mostrado antes de cualquier otra pantalla si no hay una sesión válida; al validarse contra la API, guarda el token de sesión y da paso al resto de la aplicación. |
| Tipos de formulario | Listado de todos los `FormType` existentes, con búsqueda por nombre y acceso a editar, eliminar o crear un formulario a partir de cada uno. |
| Editor de tipo de formulario | Alta/edición de un `FormType` (nombre, descripción) y de sus `FormField` (añadir, editar, reordenar, eliminar campos; tipo, obligatoriedad, opciones). |
| Formularios | Listado de todos los `Form` existentes (con su tipo), con búsqueda por nombre y acceso a editar, eliminar, rellenar o ver la respuesta de cada uno. |
| Alta de formulario | Creación de un `Form` (nombre, descripción) a partir de un `FormType` existente, sin redefinir campos. |
| Relleno de formulario | Renderizado dinámico de los `FormField` del `FormType` de un `Form`, guardado incremental de su `FormResponse` (única) y edición posterior; validación de campos obligatorios para indicar si está completa, sin bloquear guardados parciales. También se usa para editar una respuesta ya guardada. |
| Respuesta de un formulario | Vista de detalle de la `FormResponse` recibida por un `Form` (como máximo una), con acceso para editarla, o estado vacío si todavía no se ha guardado ninguna. |

## 5. Formularios dinámicos
Tanto el editor de campos del builder como el relleno de formularios usan el mismo mapeo de `field_type` a componente Mantine:

| `field_type` | Componente Mantine |
|---|---|
| `text` | `TextInput` |
| `textarea` | `Textarea` |
| `number` | `NumberInput` |
| `boolean` | `Switch` |
| `select` | `Select` |
| `multi_select` | `MultiSelect` |
| `date` | `DatePickerInput` (`@mantine/dates`) |

## 6. Testing y calidad
- Unit/component tests de hooks de features y componentes con Vitest + React Testing Library.
- Tests e2e de flujos críticos (crear un tipo de formulario, crear un formulario a partir de él, rellenarlo de forma incremental, editar la respuesta y consultarla) con Playwright contra un navegador real.
- ESLint integrado en el flujo de desarrollo.

## 7. CI/CD: GitHub Actions
El repositorio usa **GitHub Actions** como proveedor de CI, con un runner `ubuntu-latest`. Workflow propuesto (`.github/workflows/frontend-ci.yml`), disparado en push/PR sobre rutas de `frontend/`:

1. Checkout del repo (`actions/checkout@v4`).
2. Setup de Node.js 24.x (`actions/setup-node@v4`) con caché de pnpm.
3. Instalación de dependencias (`pnpm install --frozen-lockfile`).
4. Lint (`pnpm lint`) y chequeo de tipos (`tsc --noEmit`).
5. Tests unitarios/componentes (`pnpm test`) con Vitest.
6. Build de producción (`pnpm build`, `vite build`).
7. Tests e2e (`pnpm test:e2e`) con Playwright, contra el build servido localmente.
8. (En rama principal, cuando aplique) publicación de los assets estáticos al hosting definido, como paso previo a un despliegue que se definirá junto con el hosting (§9).

## 8. Estructura de carpetas propuesta
```
frontend/
  src/
    app/                  # entry point, providers (Mantine, TanStack Query, Router)
    features/
      auth/                # pantalla de contraseña, gestión del token de sesión
      form-types/          # builder de tipos de formulario (definición de campos)
      forms/               # creación de formularios a partir de un tipo
      form-responses/      # relleno y consulta de respuestas
    api/                   # cliente generado (OpenAPI) + hooks de TanStack Query
    components/            # componentes UI reutilizables
    lib/                   # utils, helpers
  tests/
    unit/
    e2e/
.github/
  workflows/
    frontend-ci.yml
```

## 9. Pendiente de decisión
- Proveedor de hosting de los assets estáticos (CDN/estático dedicado, mismo dominio que el backend, etc.), coordinado con la decisión de hosting del backend ([docs/backend.md](backend.md) §10) — afecta a la configuración de CORS entre frontend y backend.
- Soporte real de dispositivos móviles/tablet más allá de un diseño responsive básico (el foco del MVP es uso en escritorio/laptop vía navegador).
