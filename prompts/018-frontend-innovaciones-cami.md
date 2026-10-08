# 018 — Plan frontend de innovaciones independientes (Cami)

**Estado:** Plan para revisión; no implementado.  
**Fecha del relevamiento:** 2026-09-28  
**Alcance:** prototipos de interfaz con datos ficticios y ajustes exclusivamente frontend. No incluye cambios de base de datos, reglas persistidas, integraciones, ni generación de informes reales.

## Objetivo

Identificar qué partes de las cinco innovaciones ya existen en `cielo-abierto` y proponer cambios pequeños, compatibles con Next.js App Router y los componentes actuales. Los prototipos nuevos deben indicar claramente que son demostraciones, usar datos ficticios, no escribir en Supabase y no alterar los flujos operativos existentes.

Este documento no autoriza implementación. Seguir el ciclo de `AGENTS-WEB.md`: revisión y aprobación del plan antes de tocar código.

## Contexto y arquitectura confirmada

- Next.js 16 App Router; pantallas bajo `app/(dashboard)/`.
- Primitivas UI en `components/ui/`; componentes compartidos en `components/shared/`; componentes de dominio en `components/entities/<entidad>/`.
- La UI operativa consulta/muta Supabase mediante hooks en `hooks/<entidad>/` y TanStack Query. Los prototipos de este plan no deben llamar esos hooks para sus datos ficticios ni mezclarlos con los resultados reales.
- `docs/design-system.md` documenta `Button`, `Badge`, `Card`, `Input`, `Select`, `Textarea`, `Dialog`, `Tabs`, `FormField` y `FormGrid`; se deben reutilizar donde corresponda, conservando la presentación sobria y las etiquetas de accesibilidad existentes.
- No se identificó la necesidad de agregar dependencias: el selector de periodo usa los controles existentes y la descarga de muestra puede generarse en el navegador con `Blob`/URL, siguiendo el patrón ya usado en Informes.
- Las rutas actuales relevantes son `/nnya/[id]`, `/seguimiento-post-egreso`, `/informes`, `/alertas` y `/propuestas-mejora`.

## Archivos y documentación inspeccionados

- `AGENTS-WEB.md`, `docs/design-system.md` y `PLAN-INTEGRACION-INNOVACIONES.md`.
- `docs/evolucion/00-RESUMEN-EJECUTIVO-FINAL.md`, `docs/evolucion/CHECKLIST-FINAL (1).md` y el fragmento del schema en `docs/evolucion/03-PROMPTS-A0-A1-A2-DEFINITIVO-v2.md`.
- `prompts/022-fase-c-evaluacion-institucional.md`, `prompts/026-fase-e-seguimiento-post-egreso.md` y el schema de seguimiento de `prompts/012-tutela-evaluacion-turnos-seguimiento.md`.
- `app/(dashboard)/nnya/page.tsx`, `app/(dashboard)/nnya/[id]/page.tsx`, `app/(dashboard)/legajos/[id]/page.tsx`, `components/legajos/tabs/ResumenTab.tsx`.
- `app/(dashboard)/seguimiento-post-egreso/page.tsx`, `components/entities/seguimiento-post-egreso/{SeguimientoList,SeguimientoForm,ReinsercionResumen}.tsx`, `hooks/seguimiento-post-egreso/*`, `lib/validations/seguimiento-post-egreso.schema.ts`, `types/database.types.ts` y las migraciones `20260827000033_create_tutela_evaluacion_turnos_seguimiento.sql` y `20260916012756_seguimiento_post_egreso_trigger.sql`.
- `app/(dashboard)/informes/page.tsx`, `components/entities/informes/{InformeForm,InformeList}.tsx`, `hooks/informes/*` y `supabase/migrations/20260514000013_informes.sql`.
- `app/(dashboard)/alertas/page.tsx`, `components/entities/alertas/AlertaList.tsx`, `components/legajos/tabs/AlertasTab.tsx`, `hooks/alertas/*` y las migraciones `20260514000008_alertas.sql` y `20260609000029_alerta_trigger.sql`.
- `app/(dashboard)/propuestas-mejora/page.tsx`, `app/(dashboard)/evaluacion-institucional/[id]/page.tsx`, `components/entities/propuestas-mejora/{PropuestasKanban,PropuestaMejoraForm}.tsx`, `hooks/propuestas-mejora/*`, `types/database.types.ts` y el schema/RLS de las migraciones A1/A2.
- `package.json` para confirmar dependencias disponibles.

El archivo `prompts/018-audit-log-real.md` ya existe. Este plan usa el nombre diferente `018-frontend-innovaciones-cami.md`, por lo que no lo reemplaza.

## Estado actual por funcionalidad

| Funcionalidad | Estado confirmado en código | Brecha frente al pedido |
|---|---|---|
| Timeline por NNyA | No hay timeline ni agregador cronológico. `/nnya/[id]` muestra datos personales, legajo y tutores. El detalle de legajo distribuye intervenciones, incidentes, alertas, turnos, salud, informes y documentos en pestañas, no como historial unificado. | Hace falta una vista de demostración; las fuentes y reglas para una futura línea de tiempo real no están definidas como contrato único. |
| Seguimiento post-egreso | UI real implementada en `/seguimiento-post-egreso`: listado, registro de contacto y resumen de reinserción. El listado presenta el valor de días recibido. Trigger y backfill crean hitos de 30 y 60 días. | No existe un hito operativo de 90 días. La columna está limitada a 30/60 en la base y el tipo de dominio es `30 | 60`; el formulario actual edita el contacto de una fila existente. |
| Informes SENAF | `/informes` lista informes reales de `informes`, permite filtrar por estado/tipo/búsqueda y exporta las filas filtradas a CSV. En el legajo se crean, revisan/consultan y marcan informes como enviados. | No existe selector mensual/anual para un informe SENAF ni generador oficial. El repositorio no confirma los campos ni el formato exigido por SENAF. |
| Alertas educativas | `/alertas` consulta alertas reales y permite filtrarlas, pasarlas a proceso y resolverlas. La documentación y el trigger describen la generación automática existente para incidentes graves/críticos. La entidad de alertas es genérica; no se encontró un formulario de ausencias ni una entidad de ausencias escolares. | Hace falta una demostración local para cargar ausencias y mostrar ejemplos educativos sin persistirlos ni generar alertas reales. |
| Kanban de propuestas | `/propuestas-mejora` y el detalle de evaluación usan `PropuestasKanban`, con cuatro estados: Abierto, En progreso, Completado y Cancelado. Mover propuestas usa `useUpdatePropuestaMejora`; el tipo de estado corresponde al schema persistido. | “Verificado” no existe como estado persistido ni en el Kanban. La documentación lo identifica como decisión pendiente; el sentido, responsable y evidencia de verificación no están definidos. |

## Propuesta por funcionalidad

### 1. Timeline de NNyA

**Interfaz propuesta:** agregar en el detalle `/nnya/[id]` una sección de vista previa cronológica, implementada como componente visual separado. Usar una ficha/caso de ejemplo claramente ficticio, sin combinar sus acontecimientos con los datos reales del NNyA de la ruta. Incluir una marca visible persistente del tipo “Demostración — datos ficticios; no es el historial de este NNyA”. Ordenar los elementos de la muestra por fecha descendente o ascendente de forma consistente y representar fecha, categoría y breve descripción con `Badge` y estilos del sistema.

**Archivos propuestos:**
- Modificar `app/(dashboard)/nnya/[id]/page.tsx` para ubicar la sección de vista previa.
- Crear `components/entities/nnya/TimelineNnyaDemo.tsx` para la presentación y los datos de muestra locales.

**Reutilización:** `Badge`, `Card`/sus subcomponentes y tipografía/colores descriptos en `docs/design-system.md`; navegación de regreso y composición de secciones del detalle actual. No agregar hooks de datos para la demostración.

**Datos ficticios:** tres a cinco acontecimientos neutros (por ejemplo, apertura de legajo, intervención, turno y seguimiento), con fechas coherentes y sin nombres, DNI, expediente ni observaciones clínicas reales. No afirmar que estos son los eventos oficiales que debe cubrir el timeline.

**Pendiente/riesgo:** definir qué tipos de evento son relevantes, cuáles de las tablas son fuentes, cómo tratar eventos sin fecha/hora comparable y qué controles de acceso/sensibilidad aplican. El plan de integración menciona fuentes candidatas (`legajos`, `intervenciones`, `incidentes`, `diagnosticos`, `vinculos_tutela`, `nnya.fecha_egreso`, entre otras), pero eso no equivale a una decisión funcional ni a una query ya implementada. La agregación real queda fuera de este trabajo independiente.

### 2. Seguimiento post-egreso y hito de 90 días

**Interfaz propuesta:** mantener intactos el listado real de hitos 30/60, el formulario de contacto y el resumen. Agregar, separado del resultado real, una muestra visual del hito de 90 días con etiqueta inequívoca “Demostración” y un caso ficticio. No ofrecer registro de contacto ni una acción que parezca guardar ese hito.

**Archivos propuestos:**
- Modificar `app/(dashboard)/seguimiento-post-egreso/page.tsx` para incluir la muestra y distinguirla del conteo de seguimientos reales.
- Crear `components/entities/seguimiento-post-egreso/Hito90Demo.tsx` como presentación estática, sin `useUpdateSeguimiento`.

**Reutilización:** `Badge`, `Card`, formatos de fecha locales y el patrón visual de `SeguimientoList.tsx`. `SeguimientoForm.tsx` no se usa para la fila ficticia.

**Datos ficticios:** un caso sin identidad real y una fecha de egreso de ejemplo con la fecha programada calculada como egreso + 90 días; mostrarla como ilustrativa, no persistida.

**Límite técnico y pendiente:** `CHECK (dias_post_egreso IN (30, 60))` está en la migración A1; `types/database.types.ts` reduce el dominio a `30 | 60`; el trigger `fn_crear_seguimiento_post_egreso` y su backfill crean exactamente esos dos hitos. Por eso una fila 90 no puede incorporarse al flujo real con un cambio de frontend. Ampliar el constraint, el trigger/backfill y los tipos es trabajo de base/backend y está expresamente excluido. Mantener visible que 30/60 sí son operativos y que 90 es solo un ejemplo.

### 3. Demostración de informes mensuales estilo SENAF

**Interfaz propuesta:** añadir un bloque separado dentro de `/informes` con selectores de mes y año y un botón de descarga de muestra. Identificar el bloque y el archivo descargado como demostración con datos ficticios; incluir en el archivo una advertencia de que no es un informe oficial ni reproduce el formato SENAF. Mantener sin cambios la tabla real, filtros, CRUD y exportación CSV ya existentes.

**Archivos propuestos:**
- Modificar `app/(dashboard)/informes/page.tsx` para alojar el bloque aislado.
- Crear `components/entities/informes/InformeSENAFDemo.tsx` para selección de periodo y descarga local. No modificar `InformeForm`, `InformeList`, `useInformes` ni los hooks de mutación.

**Reutilización:** `Select`, `Input` si se requiere, `Button`, `Card`, `Badge`, icono `Download` de lucide-react y la técnica `Blob`/URL del exportador CSV existente. No agregar librería de PDF ni endpoint.

**Datos ficticios:** un resumen pequeño de muestra asociado al mes/año elegido, con conteos genéricos y valores inventados; no copiar personas ni filas de Supabase. La descarga puede ser CSV de demostración con nombre explícito, por ejemplo `demo-no-oficial-AAAA-MM.csv`. No etiquetar columnas ni métricas como requerimientos reales de SENAF.

**Pendiente/riesgo:** falta la especificación confirmada de SENAF (campos, definiciones, validaciones, formato y destinatario). La interfaz de demostración no debe inferirla. La generación real, PDF oficial, almacenamiento, firma y envío quedan fuera del alcance y requieren decisiones del equipo/backend.

### 4. Interfaz demostrativa de ausencias y alertas educativas

**Interfaz propuesta:** conservar el listado operativo de alertas y agregar un bloque diferenciado “Demostración de alertas educativas” dentro de `/alertas`. Permitir cargar localmente una ausencia de muestra (NNyA ficticio o selector de perfiles ficticios, fecha y observación breve) y mostrar ejemplos de alerta educativa predefinidos o derivados únicamente para la sesión local. Aclarar en la UI que no se guarda, no se notifica y no genera una alerta operativa; el estado desaparece al recargar.

**Archivos propuestos:**
- Modificar `app/(dashboard)/alertas/page.tsx` para montar el bloque sin alterar las acciones sobre alertas reales.
- Crear `components/entities/alertas/AlertasEducativasDemo.tsx` con estado React local, formulario y ejemplos.

**Reutilización:** `Input`, `Textarea`, `Select`, `Button`, `Badge`, `FormField`/`FormGrid`, patrones de mensajes de estado; `AlertaList` sirve como referencia visual, pero no se le deben pasar filas de demo junto con alertas reales.

**Datos ficticios:** ausencias fechadas y una o más alertas ilustrativas asociadas a perfiles ficticios. No usar nombres de personas reales ni interpretar la escolaridad real de un NNyA.

**Pendiente/riesgo:** no están definidos el umbral o regla para generar una alerta, el catálogo de motivos, quién registra/valida la ausencia ni su relación con una escuela. No simular una regla automática basada en un umbral inventado. La demostración puede presentar ejemplos estáticos; los criterios de negocio, persistencia, base y disparo automático quedan para decisión del equipo.

### 5. Estado “Verificado” en el Kanban

**Interfaz propuesta:** mostrar cómo se vería una quinta columna “Verificado” con una única tarjeta ficticia, identificada por badge/leyenda “Estado de demostración; no persistido”. Aislar la tarjeta del array recibido por `PropuestasKanban` y no habilitar botones de mover/cancelar sobre ella. Las cuatro columnas, sus acciones y los datos reales deben permanecer sin cambios. Si el diseño requiere adaptar el contenedor, contemplar scroll horizontal en pantallas estrechas antes que comprimir excesivamente las columnas actuales.

**Archivos propuestos:**
- Modificar `components/entities/propuestas-mejora/PropuestasKanban.tsx` para renderizar el ejemplo de forma segregada, sin agregar `verificado` al tipo de `PropuestaMejora` ni a `COLUMNAS` operativas.
- Mantener `app/(dashboard)/propuestas-mejora/page.tsx` y `app/(dashboard)/evaluacion-institucional/[id]/page.tsx` usando el Kanban actual; validar que la muestra se identifique igual en ambas ubicaciones si se reutiliza allí.

**Reutilización:** estructura de columna y tarjetas de `PropuestasKanban`, `Badge`, `Card`/contenedores y diseño responsive existente. No hace falta editar hooks, query keys, formularios o tipo de base.

**Datos ficticios:** descripción inventada de una propuesta completada y marcada solo como ejemplo verificado. No atribuir verificador ni fecha de verificación hasta que el equipo defina si esos datos tienen que existir.

**Pendiente/riesgo:** `prompts/022` y `PLAN-INTEGRACION-INNOVACIONES.md` coinciden en que “Verificado” exige aclarar su diferencia respecto de “Completado” y quién puede verificarlo. El prototipo no cambia `CHECK`, tipo, RLS ni mutación. La transición y trazabilidad reales quedan bloqueadas por esas decisiones y por cambios backend que no son parte de este pedido.

## Componentes y estilos existentes a reutilizar

- `components/ui/{button,badge,card,input,select,textarea,form}.tsx` para acciones, estados, superficies y controles.
- `components/shared/{DataTable,KPICard,ConfirmDialog,AccessGuard}.tsx` cuando corresponda a listados o pantallas operativas; no es necesario agregar wrappers a las demos simples.
- `components/entities/alertas/AlertaList.tsx` como referencia de representación de alertas; `components/entities/seguimiento-post-egreso/SeguimientoList.tsx` y `ReinsercionResumen.tsx` para seguimiento; `components/entities/propuestas-mejora/PropuestasKanban.tsx` como tablero existente.
- `components/legajos/tabs/ResumenTab.tsx` como ejemplo de vistas resumidas por NNyA, sin convertirlo en una línea de tiempo.
- `date-fns` con locale español, `lucide-react`, tokens CSS de `app/globals.css` y `cn()` de `lib/utils.ts`.

No se deben duplicar primitivas ya existentes. Las diferencias de tokens anotadas en `docs/design-system.md` son deuda conocida y no forman parte de esta tarea.

## Datos ficticios y aislamiento

- Declarar las fixtures cerca del componente demostrativo; no guardarlas en tablas ni en hooks compartidos.
- Usar identificadores/nombres genéricos inequívocos como “Caso de demostración”, no datos semilla ni datos de personas del sistema.
- Marcar el contenedor y, cuando exista descarga, también el nombre y contenido del archivo como demostración/no oficial.
- Separar visual y funcionalmente las fixtures de los arrays de datos reales. No presentar un ejemplo estático como si hubiera sido obtenido de Supabase.
- Las acciones de demostración solo cambian estado local; no deben llamar mutaciones, invalidad query keys ni escribir en `localStorage`.

## Trabajo independiente de Cami

Se puede avanzar sin cambios de Meli/backend si se mantiene el alcance estrictamente visual y local:

- Maquetar y probar el selector mes/año y descarga de muestra no oficial.
- Prototipar la carga local de ausencias y tarjetas educativas ficticias, sin persistencia ni umbrales automáticos.
- Presentar un hito 90 ilustrativo sin registrarlo ni permitir editarlo como seguimiento real.
- Prototipar el timeline con una fixture separada y rotulada; documentar fuentes/criterios pendientes.
- Presentar una tarjeta/columna visual “Verificado (demostración)” sin mutación.
- Verificar responsive, accesibilidad básica, rotulado demo, lint, build y navegación de pantallas afectadas.

## Pendientes de equipo/backend o decisión

- **Seguimiento 90 real:** aprobación de producto y migración para constraint, trigger/backfill y tipos. No hacer en este alcance.
- **Timeline conectado a datos reales:** definición funcional de eventos, fuentes/campos, orden, privacidad y manejo de datos faltantes; confirmar consultas/permisos necesarios.
- **Informe SENAF real:** especificación oficial confirmada por el equipo, reglas de agregación y decisión de formato/entrega. No inferirla desde la UI actual de Informes.
- **Alertas educativas operativas:** definición de captura, catálogo, umbrales/reglas y destino de persistencia; cambios de schema o automatización por los responsables de backend.
- **Estado Verificado operativo:** significado frente a Completado, rol verificador, registro de quién/cuándo y decisión de schema/RLS/mutación.
- Cualquier conexión con Didit, sincronización de calendarios, aprobaciones reales y cambios en reglas de negocio permanecen expresamente fuera de este plan.

## Riesgos y contradicciones documentales

1. `PLAN-INTEGRACION-INNOVACIONES.md` describe el hito 90 como gap de producto y propone ampliar el `CHECK` y el trigger. En cambio, la migración A1 y `prompts/012` fijan explícitamente 30/60; `prompts/026`, la migración `20260916012756_seguimiento_post_egreso_trigger.sql`, la pantalla actual y `types/database.types.ts` también confirman 30/60. Para el estado implementado prevalecen schema y código; en este pedido, el 90 solo puede mostrarse como fixture.
2. `AGENTS-WEB.md` resume la fase E como “cron 30/60 días”, pero `prompts/026` y el trigger vigente explican que la generación ocurre por evento al registrar fecha de egreso, no por cron. No agregar infraestructura de cron.
3. `PLAN-INTEGRACION-INNOVACIONES.md` marca las alertas educativas como parciales porque existe `alertas`, mientras que el código solo confirma alertas genéricas y generación asociada a incidentes graves/críticos. No hay formulario ni captura de ausencias escolares en las áreas inspeccionadas.
4. La innovación de Reportería SENAF figura como inexistente en el plan de integración. La ruta `/informes` existente no contradice eso: es un módulo de informes individuales conectados a Supabase y su CSV exporta esos registros, no un informe mensual SENAF.
5. Los documentos de planificación reconocen que “Verificado” está ausente y necesita definición. El Kanban y su tipo actuales confirman cuatro estados. No modificar estado persistido para resolver esa diferencia.
6. Timeline figura como inexistente tanto en el plan de integración como en la inspección de las vistas de NNyA/legajo. El resumen del legajo no es un timeline: son resúmenes por sección.

## Orden sugerido de implementación (posterior a aprobación)

1. **Informe mensual de demostración:** aislado, sin requerir endpoint ni formato oficial; selector de mes/año y descarga marcada no oficial.
2. **Alertas educativas de demostración:** formulario de ausencia local y ejemplos estáticos; conservar intacta la operación actual de Alertas.
3. **Hito 90 ilustrativo:** separar visualmente la muestra de los registros 30/60 persistidos; no presentar conteo o mutación falsa.
4. **Timeline de demostración:** componente autónomo con cronología ficticia; dejar fuentes y alcance del timeline real como decisión posterior.
5. **Vista “Verificado” ilustrativa:** hacerla después de acordar cómo se comunica que es solo mock y revisar el responsive del Kanban; no mover propuestas reales a ese estado.

Las tareas 1–4 son independientes entre sí una vez aprobado el alcance de prototipo. La tarea 5 puede prepararse visualmente, pero su aceptación como concepto de producto requiere aclarar “Verificado” frente a “Completado”. No iniciar ninguna implementación real que requiera las decisiones listadas arriba.

## Criterios de aceptación del trabajo frontend

- Las rutas y flujos operativos actuales siguen funcionando y muestran los mismos datos reales que antes.
- Cada bloque de datos ficticios está rotulado en la pantalla; las muestras no se mezclan con filas reales.
- Los demos no invocan hooks de consulta/mutación de Supabase, no invalidan queries y no persisten cambios.
- El hito real 30/60 y el Kanban real de cuatro estados no se alteran; 90 y Verificado se presentan únicamente en una zona de demostración.
- El módulo de Informes real y su exportación no se reemplazan; la descarga nueva indica en pantalla y archivo que no es oficial y contiene solo fixture.
- Las ausencias de ejemplo no se almacenan ni disparan alertas reales; no se afirma un umbral automático.
- No se agregan dependencias ni se modifican schema, migraciones, tipos generados/dominio, hooks operativos o políticas RLS.
- Las vistas nuevas o modificadas son utilizables en móvil y escritorio, mantienen las primitivas/tokens existentes y no exponen datos reales en la muestra.

## Chequeos y verificación manual propuestos

- Tras implementar cada bloque aprobado: `npm run lint`, `npm run build` y revisión manual de las rutas afectadas. No hay suite Playwright existente según `AGENTS-WEB.md`.
- En `/nnya/[id]`, confirmar que la muestra indica datos ficticios y que no se presenta como historia del NNyA real.
- En `/seguimiento-post-egreso`, confirmar que las filas 30/60 mantienen las acciones actuales y que el ejemplo de 90 no habilita guardar contacto ni se incluye en el conteo real.
- En `/informes`, elegir dos periodos distintos, descargar la muestra y verificar que el archivo identifica periodo, demo y condición no oficial; confirmar que la exportación CSV existente sigue exportando informes reales.
- En `/alertas`, registrar una ausencia de ejemplo, confirmar el reflejo únicamente local y recargar para comprobar que no persiste; confirmar que las acciones de las alertas reales siguen intactas.
- En `/propuestas-mejora` y en el detalle de evaluación, comprobar que el ejemplo “Verificado” no aparece como propuesta devuelta por la query ni puede moverse; los cuatro estados reales conservan sus acciones.

## Seguridad

No acceder ni replicar datos sensibles de NNyA en las fixtures. Las demostraciones no son un mecanismo de autorización ni una nueva fuente de verdad. No introducir datos ficticios en Supabase, llamadas a servicios externos, reglas de aprobación, conexiones Didit ni calendarios. Mantener el control de acceso actual de las rutas y componentes operativos.