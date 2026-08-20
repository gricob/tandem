# PRD: Tandem — Plataforma de creación de formularios

## 1. Resumen ejecutivo
El proyecto se llamará **Tandem**. Esta aplicación permite crear formularios configurables, compartirlos para que cualquiera los rellene, y consultar las respuestas recibidas en un mismo lugar. Su propósito es dar al equipo una fuente propia de datos estructurados y centralizados —recogidos de forma rápida y consistente— que sirva de base para tomar decisiones informadas a la hora de definir nuevas funcionalidades. En esta primera versión no requiere cuentas de usuario ni distingue roles: cualquier persona que conozca la contraseña de acceso compartida puede crear formularios, rellenarlos y ver sus respuestas. El acceso a la aplicación (web y API) está protegido desde el MVP por una contraseña simple compartida, sin cuentas ni usuarios diferenciados; la autenticación real de usuarios no forma parte de este alcance inicial, pero está prevista para una fase posterior (ver [Sección 12](#12-supuestos-y-dependencias)).

## 2. Problema a resolver
Antes de que una tarea pueda pasar a la fase de desarrollo, quien la define (product owner) necesita dejar claros los datos y requisitos que el equipo técnico necesita para poder abordarla. Ese mismo problema —tener una estructura clara y repetible para recopilar información de un grupo de personas— aparece también en encuestas internas, formularios de solicitud, checklists o recogida de datos puntual, y hoy suele resolverse con herramientas externas de terceros o soluciones improvisadas (hojas de cálculo, documentos compartidos, mensajes), lo que genera:

- Falta de una estructura clara y reutilizable para especificar qué información necesita una tarea antes de pasar a desarrollo.
- Falta de datos estructurados y centralizados que el equipo pueda usar como base objetiva para decidir qué funcionalidades priorizar o construir.
- Dependencia de herramientas externas para necesidades simples de captura de datos.
- Falta de un espacio propio donde ver, en un mismo lugar, los formularios creados y las respuestas recibidas.
- Dificultad para reutilizar o adaptar formularios existentes.

## 3. Usuarios objetivo
Tandem no distingue roles ni cuentas: cualquier persona con acceso a la aplicación puede desempeñar dos tipos de uso, indistintamente:

### 3.1 Quien crea formularios
Necesita definir los campos de un tipo de formulario, crear formularios a partir de él y compartirlos para que otras personas los rellenen. Un caso de uso central es el de un product owner que, dado un requisito, define mediante un `FormType` qué datos necesita dejar claros para que la tarea pueda pasar a la fase de desarrollo.

### 3.2 Quien rellena formularios
Necesita completar un formulario compartido con la información solicitada.

## 4. Propuesta de valor
La plataforma da al equipo una fuente propia de datos estructurados sobre requisitos, necesidades, preferencias o feedback, que sirve de insumo directo para decidir qué funcionalidades definir y priorizar, y para asegurar que una tarea cuenta con la información necesaria antes de pasar a desarrollo. Para ello ofrece, en un único espacio:

- Crear tipos de formulario definiendo sus campos y tipos de dato una única vez.
- Crear formularios a partir de un tipo existente, listos para compartir sin tener que redefinir sus campos.
- Compartir el formulario para que cualquiera lo rellene.
- Rellenar formularios creados por otros.
- Consultar y revisar la respuesta recibida a cualquier formulario, como base para la toma de decisiones.

## 5. Objetivos medibles
### 5.1 Objetivos de producto
- Lograr que se pueda crear un formulario listo para compartir en menos de 5 minutos.
- Lograr que al menos el 90% de los formularios creados reciban una respuesta completa (con todos los campos obligatorios rellenados).
- Reducir a cero la dependencia de hojas de cálculo o herramientas externas para la recogida de datos estructurados dentro del equipo que adopte la herramienta.

## 6. Alcance del producto
### MVP (versión inicial)
- Creación, edición y eliminación de tipos de formulario, incluyendo la configuración de sus campos (tipo de dato, obligatoriedad, opciones, orden).
- Creación, edición y eliminación de formularios a partir de un tipo de formulario existente, sin necesidad de volver a definir sus campos.
- Relleno de formularios y envío de respuestas.
- Listado y consulta de las respuestas recibidas por formulario.

### Fuera de alcance inicial
- Cuentas de usuario, autenticación real y roles (previsto para una fase posterior; ver [Sección 12](#12-supuestos-y-dependencias)). La protección de acceso mediante contraseña compartida sí forma parte del MVP.
- Control de acceso o restricciones de visibilidad sobre tipos de formulario, formularios o respuestas.
- Estados de publicación del formulario (borrador, publicado, cerrado).
- Formularios públicos con enlace específico fuera de la aplicación.
- Lógica condicional entre campos (mostrar/ocultar preguntas según respuestas previas).
- Exportación de respuestas (CSV, XLSX) y analítica/agregación de resultados.
- Notificaciones sobre nuevas respuestas.
- Comentarios, adjuntos e historial de cambios sobre formularios o respuestas.
- Cualquier flujo de gestión de trabajo, entregables, revisión funcional o roadmap.

## 7. Arquitectura de alto nivel
Tandem se compondrá de dos partes principales:

- **Backend**: expone la API necesaria para la gestión de todos los datos del dominio (tipos de formulario, campos de formulario, formularios, respuestas), protegida por una contraseña compartida simple, sin autenticación real de usuarios ([docs/backend.md](backend.md) §2 y §5).
- **Frontend**: aplicación web (SPA) que consume la API del backend y ofrece la experiencia de usuario para crear formularios, rellenarlos y consultar sus respuestas.

## 8. User stories principales
### 8.1 Creación y gestión de tipos de formulario y formularios
- Como usuario, quiero crear un tipo de formulario dándole un nombre y una descripción, para definir una estructura de datos reutilizable.
- Como usuario, quiero añadir, editar, reordenar y eliminar campos de un tipo de formulario, eligiendo su tipo de dato y si son obligatorios, para definir la estructura de captura que necesito.
- Como usuario, quiero crear un formulario a partir de un tipo de formulario existente, para compartirlo sin tener que redefinir sus campos cada vez.
- Como usuario, quiero eliminar un tipo de formulario o un formulario que ya no necesito, para mantener ordenados los listados.

### 8.2 Relleno de formularios
- Como usuario, quiero ver la lista de formularios disponibles, para elegir cuál rellenar.
- Como usuario, quiero rellenar un formulario completando sus campos, para guardar mi respuesta.
- Como usuario, quiero poder guardar mi respuesta de forma incremental sin completar todos los campos de una vez, para rellenarla en varias sesiones.
- Como usuario, quiero poder volver a un formulario ya respondido y editar mi respuesta, para corregirla o actualizarla.
- Como usuario, quiero recibir una validación clara si me falta completar un campo obligatorio, para saber qué me falta para darla por completa.

### 8.3 Consulta de respuestas
- Como usuario, quiero ver la respuesta recibida a un formulario, para saber qué se ha contestado.

### 8.4 Transversal
- Como usuario, quiero buscar formularios por nombre, para encontrar rápidamente el que necesito.

## 9. Flujo de trabajo del formulario
### 9.1 Principios de diseño
- Un tipo de formulario (`FormType`) se compone de una lista ordenada de campos configurables (`FormField`), cada uno con su propio tipo de dato y obligatoriedad.
- Un formulario (`Form`) se crea a partir de un `FormType` y hereda sus campos: varios formularios pueden compartir el mismo tipo sin redefinir la estructura.
- Un formulario no es una herramienta de encuestas: recoge información puntual sobre una funcionalidad, por lo que admite como máximo una respuesta, no una por cada persona que lo rellena. Esa respuesta se puede guardar de forma incremental y editar tantas veces como haga falta, incluso después de estar completa.
- No hay restricciones de acceso: cualquiera puede crear, editar o eliminar cualquier tipo de formulario o formulario, y rellenar, editar o consultar la respuesta de cualquier formulario.

### 9.2 Comportamiento esperado
1. Se crea un tipo de formulario y se definen sus campos.
2. Se crea uno o varios formularios a partir de ese tipo, listos para compartir sin redefinir campos.
3. El formulario queda disponible para que cualquiera lo rellene.
4. Se rellena el formulario y se guarda la respuesta, de forma incremental si hace falta; los campos obligatorios se validan para saber si la respuesta está completa, pero no bloquean guardados parciales.
5. Se puede volver al formulario en cualquier momento para completar o editar la respuesta ya guardada.
6. Se consulta la respuesta recibida.

### 9.3 Requisitos funcionales asociados
1. Creación, edición y eliminación de tipos de formulario.
2. Configuración de campos de un tipo de formulario (tipo, obligatoriedad, opciones, orden).
3. Creación, edición y eliminación de formularios a partir de un tipo de formulario.
4. Listado de formularios disponibles para rellenar.
5. Relleno y guardado incremental de la respuesta a un formulario, con posibilidad de editarla después, validación de campos obligatorios para saber si está completa, y límite de una única respuesta por formulario.
6. Consulta de la respuesta recibida por un formulario.
7. Búsqueda de formularios por nombre.

## 10. Requisitos no funcionales
- Usabilidad: la interfaz debe ser intuitiva y reducir el tiempo de aprendizaje, siguiendo las convenciones habituales de una aplicación web moderna, con foco principal en uso de escritorio/laptop vía navegador.
- Rendimiento: la aplicación debe responder rápidamente con volúmenes moderados de formularios y respuestas.
- Confiabilidad: el sistema debe minimizar pérdidas de información, especialmente de las respuestas enviadas.
- Escalabilidad: la arquitectura backend/frontend debe permitir crecer hacia más formularios y más tipos de campo.
- Accesibilidad: el producto debe ser usable con principios básicos de accesibilidad web (navegación por teclado, contraste, semántica de componentes).
- Disponibilidad: objetivo de disponibilidad del servicio backend de al menos 99,5% en producción.

## 11. Criterios de éxito
- El equipo dispone de datos estructurados y centralizados que utiliza como base para decidir nuevas funcionalidades.
- Se puede crear y compartir un formulario sin necesidad de soporte o documentación adicional.
- Se reduce a cero el uso de herramientas externas para la recogida de datos estructurados dentro del equipo que adopte la herramienta.
- Las respuestas quedan siempre disponibles y consultables, sin pérdida de información.

## 12. Supuestos y dependencias
- El acceso a la aplicación (web y API) está protegido desde el MVP por una contraseña general compartida (sin cuentas ni usuarios diferenciados), con independencia del entorno de despliegue; es una medida mínima y no un sustituto de la autenticación real de usuarios prevista más adelante (ver [docs/backend.md](backend.md) §2 y §5).
- El frontend se distribuirá como aplicación web (SPA) accesible desde el navegador; no se distribuye como aplicación de escritorio nativa en el MVP.
- La autenticación de usuarios está prevista para una fase posterior al MVP; su llegada introducirá cuentas y, previsiblemente, control de acceso sobre formularios y respuestas. El diseño del dominio y de la API debe evitar decisiones que dificulten incorporarla más adelante.
- La solución puede evolucionar además hacia lógica condicional, plantillas o exportación de datos en fases posteriores, si la necesidad de esas features avanzadas lo justifica.

## 13. Conclusión
El producto propuesto, Tandem, da al equipo una fuente propia de datos estructurados que ayuda a definir nuevas funcionalidades: permite definir formularios con campos configurables, compartirlos para que se rellenen, y consultar las respuestas recibidas en un único lugar. En esta primera versión no incluye cuentas de usuario; la autenticación está prevista para una fase posterior.
