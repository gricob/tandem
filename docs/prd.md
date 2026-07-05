# PRD: Tandem — Plataforma de planificación, gestión y seguimiento del desarrollo de software

## 1. Resumen ejecutivo
El proyecto se llamará **Tandem**. Esta aplicación busca centralizar la planificación, ejecución y seguimiento del trabajo de desarrollo de software para equipos que incluyen Product Owners y Developers. Su propósito es reducir la fragmentación de información entre documentos, chats, hojas de cálculo y herramientas dispersas, mejorando la coordinación, la trazabilidad y la visibilidad del progreso durante todo el ciclo de vida del producto.

La plataforma permitirá transformar ideas en entregables claros, descomponer el trabajo en tareas accionables, asignar responsables, monitorear estados y mantener a ambos roles alineados desde la definición inicial hasta la entrega.

## 2. Problema a resolver
Actualmente, muchos equipos sufren de una separación entre la definición del producto y la ejecución técnica. El Product Owner define prioridades y requisitos, mientras que los desarrolladores ejecutan tareas en entornos y herramientas distintas. Esto genera:

- Pérdida de contexto entre negocio y desarrollo.
- Dificultad para seguir el estado real del trabajo.
- Falta de trazabilidad entre una idea, su implementación y su entrega.
- Sobrecarga operativa por gestión manual y duplicación de información.
- Desalineación frecuente entre prioridades esperadas y progreso real.

## 3. Usuarios objetivo
### 3.1 Product Owners
Necesitan convertir ideas en entregables claros, priorizar trabajo y supervisar avance sin perder contexto.

### 3.2 Developers
Necesitan entender qué deben hacer, por qué, con qué prioridad y qué dependencias existen, así como actualizar el estado de sus tareas de forma ágil.

### 3.3 Team Leads / Engineering Managers
Necesitan visibilidad del progreso del equipo, riesgos, bloqueos y carga de trabajo.

### 3.4 Administrators
Necesitan dar de alta y gestionar los usuarios y sus roles, y configurar los elementos base de la plataforma (tipos de requisito y formularios) para adaptarla a las prácticas del equipo.

## 4. Propuesta de valor
La plataforma ofrece un único espacio donde Product Owners y Developers pueden:

- Definir workstreams, entregables y tareas.
- Mantener contexto funcional y técnico en el mismo lugar.
- Planificar y hacer seguimiento de entregas.
- Reducir fricción y mejorar la colaboración.
- Aumentar la transparencia del progreso y de los riesgos.

## 5. Objetivos medibles
### 5.1 Objetivos de negocio
- Reducir en un 40% el tiempo medio de coordinación entre Product Owners y Developers en los primeros 3 meses de uso.
- Incrementar en un 30% la visibilidad del estado del trabajo para todos los miembros del equipo.
- Mejorar la tasa de cumplimiento de entregas planificadas en un 20% en el primer semestre.

### 5.2 Objetivos de producto
- Lograr que al menos el 90% de los work items cuenten con responsable, prioridad y estado definidos al momento de su creación.
- Asegurar que al menos el 85% de los entregables tengan trazabilidad completa hasta sus tareas asociadas.
- Reducir en un 50% las solicitudes de aclaración sobre prioridades o alcance durante la ejecución.

## 6. Alcance del producto
### MVP (versión inicial)
- Gestión de usuarios y roles básicos.
- Creación y gestión de workstreams, entregables y work items.
- Configuración de tipos de requisito y de los formularios asociados a cada tipo.
- Flujo completo de un entregable: definición de requisitos funcionales, revisión funcional del Tech Lead, análisis técnico de los developers asignados y revisión/aprobación por los reviewers antes de crear los work items.
- Board tipo Kanban con estados predefinidos.
- Vista de roadmap simple con fechas y planificación.
- Comentarios, historial y adjuntos.

### Fuera de alcance inicial
- Integraciones profundas con Git, CI/CD o herramientas externas.
- Automatizaciones avanzadas complejas.
- Dashboards de negocio sofisticados.
- Gestión avanzada de dependencias entre equipos.
- Estados de flujo configurables por tipo de work item o equipo, más allá del enum fijo del MVP.

## 7. Arquitectura de alto nivel
Tandem se compondrá de dos partes principales:

- **Backend**: expone la API necesaria para la gestión de todos los datos del dominio (usuarios, workstreams, entregables, requisitos funcionales, tipos de requisito, formularios, análisis técnico, work items, comentarios, adjuntos, bloqueos y notificaciones), así como la lógica de negocio asociada (por ejemplo, las reglas de revisión funcional y de análisis técnico).
- **Frontend**: aplicación de escritorio para macOS que consume la API del backend y ofrece la experiencia de usuario para Product Owners, Developers y Team Leads.

## 8. User stories principales
### 8.1 Product Owner
- Como Product Owner, quiero crear un Workstream para organizar el trabajo.
- Como Product Owner, quiero crear uno o más entregables dentro de un workstream, para descomponer el trabajo en unidades con contexto claro.
- Como Product Owner, quiero crear work items directamente sobre un Workstream.
- Como Product Owner, quiero crear requisitos funcionales en un entregable eligiendo su tipo y completando el formulario asociado, para capturar la información necesaria según la naturaleza de cada requisito.
- Como Product Owner, quiero marcar un entregable como "Listo para revisión" cuando todos sus requisitos funcionales estén definidos, para iniciar la validación del Tech Lead.
- Como Product Owner, quiero revisar y ajustar los requisitos de un entregable bloqueado por el Tech Lead, para resolver sus dudas y reenviarlo a revisión.
- Como Product Owner, quiero asignar los developers y reviewers de un entregable ya aprobado por el Tech Lead, para iniciar su análisis técnico.
- Como Product Owner, quiero ver el estado de avance de cada entrega, para identificar desviaciones tempranas.
- Como Product Owner, quiero ver la vista de roadmap con los entregables como hitos y sus fechas planificadas, para comunicar el plan de entrega a los stakeholders.

### 8.2 Developer
- Como Developer, quiero ver los entregables que tengo asignados para análisis técnico, con su contexto funcional completo, para evaluar su viabilidad técnica.
- Como Developer, quiero elaborar el análisis técnico de un entregable asignado, para documentar el enfoque de implementación antes de crear los work items.
- Como Developer, quiero conocer si mi análisis técnico fue aprobado o si se solicitaron cambios, para ajustarlo o continuar con la creación de work items.
- Como Developer, quiero crear los work items de un entregable como borrador mientras elaboro su análisis técnico, para ir estructurando el trabajo de desarrollo sin esperar a la aprobación.
- Como Developer, quiero que los work items en borrador de un entregable se publiquen automáticamente cuando su análisis técnico sea aprobado, para que el equipo pueda empezar a trabajar sobre ellos sin pasos manuales adicionales.
- Como Developer, quiero ver mis work items asignados con contexto, prioridad y criterios de aceptación, para trabajar de forma eficiente.
- Como Developer, quiero actualizar el estado de un work item y registrar bloqueos, para informar de forma clara mi progreso.
- Como Developer, quiero mover un work item entre estados arrastrándolo en el board Kanban, para actualizar mi progreso de forma rápida y visual.
- Como Developer, quiero consultar el historial y los comentarios relacionados con un work item, para entender decisiones previas y evitar retrabajos.

### 8.3 Team Lead / Engineering Manager
- Como Tech Lead, quiero revisar los requisitos funcionales de un entregable marcado como "Listo para revisión", para validar que el alcance está suficientemente definido.
- Como Tech Lead, quiero bloquear un entregable indicando mis dudas cuando algo no esté claro, para que el Product Owner lo revise antes de continuar.
- Como Tech Lead, quiero aprobar un entregable como "Listo para desarrollo" cuando esté correctamente definido, para habilitar la asignación de developers y reviewers.
- Como reviewer, quiero revisar el análisis técnico elaborado por los developers asignados y aprobarlo o solicitar cambios, para asegurar la calidad técnica antes de que empiece el desarrollo.
- Como Team Lead, quiero ver el estado general del equipo y los riesgos potenciales, para anticiparme a problemas de capacidad o dependencias.
- Como Team Lead, quiero filtrar el trabajo por responsable o prioridad, para identificar cuellos de botella rápidamente.

### 8.4 Todos los roles (historias transversales)
- Como usuario, quiero iniciar sesión con mis credenciales, para acceder a la plataforma de forma segura.
- Como usuario, quiero cerrar sesión, para proteger el acceso a mi cuenta cuando termino de usar la aplicación.
- Como usuario, quiero recibir notificaciones cuando se me asigne un elemento o cambie el estado de algo que me concierne, para mantenerme informado sin tener que revisar manualmente cada elemento.
- Como usuario, quiero buscar Workstreams, entregables o work items por texto o referencia, para encontrar rápidamente la información que necesito.
- Como usuario, quiero añadir comentarios y adjuntos a entregables, requisitos funcionales, análisis técnico y work items, para dejar constancia de decisiones y contexto adicional.
- Como usuario, quiero consultar el historial de cambios de un entregable, requisito funcional, análisis técnico o work item, para entender qué se modificó, cuándo y por quién.
- Como usuario, quiero filtrar el trabajo por responsable, prioridad, tipo de requisito, Workstream o entregable, para encontrar rápidamente lo que me interesa.
- Como usuario, quiero ver visualmente en qué etapa del flujo se encuentra un entregable (requisitos, revisión funcional, análisis técnico, en progreso) tanto en su detalle como en el board, para entender su estado sin tener que preguntar a otros.

### 8.5 Administrator
- Como Administrator, quiero crear cuentas de usuario y asignarles uno o más roles (Product Owner, Developer, Team Lead/Tech Lead, Reviewer), para dar de alta a los miembros del equipo con los permisos adecuados.
- Como Administrator, quiero modificar los roles de un usuario existente o desactivar su cuenta, para mantener actualizados los permisos de acceso conforme cambia el equipo.
- Como Administrator, quiero configurar los tipos de requisito disponibles, para adaptar la plataforma a las categorías de trabajo funcional del equipo.
- Como Administrator, quiero configurar los formularios y sus campos, y asociarlos a uno o varios tipos de requisito, para determinar qué información debe capturarse en cada tipo de requisito.

## 9. Flujo de trabajo del entregable
El proceso de planificación y ejecución se organiza en torno al ciclo de vida de un entregable, desde su definición funcional hasta la creación de los work items que inician el desarrollo. El objetivo es asegurar que un entregable no entre en desarrollo hasta que su alcance funcional esté validado por el Tech Lead y su viabilidad técnica haya sido documentada y aprobada por los reviewers asignados.

### 9.1 Principios de diseño
- Un Workstream es el contenedor de más alto nivel para agrupar trabajo relacionado (por ejemplo, una épica, una agrupación de tareas o una agrupación de bugs), sin que exista un tipo formal que lo distinga.
- Un Workstream puede contener entregables, work items directamente, o ambos a la vez. Los work items creados directamente sobre un Workstream no pasan por requisitos funcionales, revisión del Tech Lead ni análisis técnico; los que forman parte de un entregable sí siguen ese flujo completo.
- Cada entregable se compone de requisitos funcionales cuyo contenido depende de un tipo de requisito configurable; cada tipo de requisito tiene asociado un formulario, también configurable, que determina qué campos deben completarse.
- El Product Owner es responsable de definir y completar los requisitos funcionales del entregable, pero la transición a desarrollo requiere dos validaciones independientes:
  1. Una revisión funcional del Tech Lead sobre los requisitos definidos.
  2. Una revisión técnica de los reviewers asignados sobre el análisis técnico elaborado por los developers.
- Los developers pueden crear los work items de un entregable como borrador mientras elaboran su análisis técnico; dichos work items quedan publicados y disponibles para el desarrollo únicamente cuando el análisis técnico es aprobado por los reviewers.

### 9.2 Comportamiento esperado
1. El Product Owner crea un Workstream para agrupar el trabajo relacionado.
2. Dentro del Workstream, el Product Owner crea uno o más entregables, o work items directamente, según la naturaleza del trabajo.
3. Para cada entregable, el Product Owner crea requisitos funcionales, seleccionando un tipo de requisito por cada uno; el formulario a completar se determina por el tipo elegido.
4. Cuando todos los requisitos funcionales del entregable están definidos, el Product Owner lo marca como "Listo para revisión".
5. El Tech Lead revisa el entregable:
   - Si tiene dudas, las registra como comentarios y el entregable pasa a estado "Bloqueado"; el Product Owner debe revisar y ajustar los requisitos y volver a marcarlo como "Listo para revisión".
   - Si está todo correcto, el Tech Lead lo marca como "Listo para desarrollo".
6. El Product Owner asigna los developers y reviewers responsables del entregable y lo marca como "En análisis técnico".
7. Los developers asignados elaboran el análisis técnico del entregable y, en paralelo, van creando como borrador los work items correspondientes.
8. Los reviewers asignados revisan el análisis técnico: pueden aprobarlo o solicitar cambios. Si solicitan cambios, los developers deben ajustarlo (y, si corresponde, los work items en borrador) y volver a someterlo a revisión.
9. Cuando el análisis técnico es aprobado, el entregable pasa a "En progreso" y los work items en borrador quedan publicados para iniciar el desarrollo.

### 9.3 Requisitos funcionales asociados
1. Gestión de usuarios y permisos por rol.
2. Creación de Workstreams como contenedores de trabajo relacionado.
3. Creación y mantenimiento de entregables dentro de un Workstream.
4. Creación de work items directamente sobre un Workstream.
5. Configuración de tipos de requisito.
6. Configuración de formularios y sus campos, asociables a uno o varios tipos de requisito.
7. Creación de requisitos funcionales en un entregable, seleccionando su tipo y completando el formulario asociado.
8. Marcado de un entregable como "Listo para revisión" cuando todos sus requisitos funcionales están definidos.
9. Revisión funcional del Tech Lead: bloqueo con comentarios de dudas, o aprobación como "Listo para desarrollo".
10. Asignación de developers y reviewers a un entregable antes de iniciar el análisis técnico.
11. Elaboración del análisis técnico de un entregable por parte de los developers asignados.
12. Revisión del análisis técnico por los reviewers asignados: aprobación o solicitud de cambios.
13. Creación de work items como borrador durante la elaboración del análisis técnico, y publicación automática de dichos work items únicamente tras la aprobación del análisis técnico.
14. Estados de trabajo predefinidos para work items (draft, to_do, in_progress, blocked, done).
15. Asignación de responsables, revisores y fechas estimadas.
16. Board Kanban con arrastrar y soltar entre estados.
17. Filtrado por responsable, tipo de requisito, prioridad, Workstream o entregable.
18. Vista de roadmap con planificación temporal, usando los entregables como hitos.
19. Trazabilidad entre Workstream, entregable, requisitos funcionales, análisis técnico y work items.
20. Comentarios, historial de cambios y adjuntos en entregables, requisitos, análisis técnico y work items.
21. Registro de bloqueos, riesgos y observaciones sobre entregables y work items.
22. Notificaciones básicas por cambios de estado o asignaciones.
23. Búsqueda de elementos por texto o referencia.
24. Visualización del estado del flujo (requisitos, revisión funcional, análisis técnico) en cada entregable y en la vista de board.

## 10. Requisitos no funcionales
- Usabilidad: la interfaz debe ser intuitiva y reducir el tiempo de aprendizaje, siguiendo las convenciones de una aplicación de escritorio nativa de macOS.
- Rendimiento: la aplicación debe responder rápidamente con volúmenes moderados de datos y múltiples relaciones entre entidades.
- Seguridad: acceso seguro a la API mediante autenticación y permisos por rol.
- Confiabilidad: el sistema debe minimizar pérdidas de información y mantener consistencia en cambios de estado.
- Escalabilidad: la arquitectura backend/frontend debe permitir crecer hacia más usuarios, más automatización y más métricas.
- Accesibilidad: el producto debe ser usable con principios básicos de accesibilidad en aplicaciones de escritorio.
- Disponibilidad: objetivo de disponibilidad del servicio backend de al menos 99,5% en producción.

## 11. Criterios de éxito
- El 75% de los equipos que adopten la herramienta reportan mejor alineación entre negocio y desarrollo.
- El 90% de las tareas creadas incluyen responsable, prioridad y estado correctamente definidos.
- Se reduce el tiempo medio de seguimiento de progreso en un 40% respecto al proceso previo.
- Se observa una mejora cuantificable en la puntualidad de entregas y en la reducción de bloqueos no comunicados.
- Se observa una mejora cuantificable en la calidad de la definición de los entregables que llegan al equipo de desarrollo.

## 12. Supuestos y dependencias
- La herramienta será utilizada por equipos pequeños o medianos con procesos ágiles o híbridos.
- El frontend se distribuirá como aplicación de escritorio para macOS; otras plataformas de escritorio o web quedan fuera del alcance inicial.
- La solución puede evolucionar hacia integraciones con herramientas de desarrollo en fases posteriores.

## 13. Conclusión
El producto propuesto, Tandem, busca convertirse en un punto único de verdad para la planificación y ejecución del desarrollo de software, facilitando la colaboración entre Product Owners y Developers y mejorando la capacidad del equipo para entregar valor de forma más predecible, transparente y coordinada.
