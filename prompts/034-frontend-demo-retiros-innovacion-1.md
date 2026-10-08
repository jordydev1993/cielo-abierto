# 034 — Demos frontend para Innovación 1 y continuidad del Plan 033

**Estado:** Plan para aprobación; no implementado.
**Fecha del relevamiento:** 2026-10-08
**Alcance:** demostraciones frontend aisladas para el issue #26 y las dos demos aún autorizadas por el Plan 033. Sin integración ni persistencia real.

## 1. Objetivo

Preparar una demo visual de retiro y componentes reutilizables para la futura integración de verificación de identidad, mientras se implementan únicamente las dos demos frontend del Plan 033: Timeline de NNyA y alertas educativas.

El código de demostración se mantendrá separado de las consultas y mutaciones reales. No se conectará Didit ni RENAPER, ni se modificará `useCreateValidacionRenaper`.

## 2. Contexto verificado

- El issue #26 solicita el flujo de retiro, el widget Didit y los badges RNF-12, pero sus criterios requieren plan aprobado antes de implementar. Este alcance reduce deliberadamente ese pedido a mocks visuales.
- `prompts/033-frontend-innovaciones-cami.md` está listo para aprobación, no implementado. Autoriza Timeline y alertas educativas demo, y deja explícitamente fuera SENAF, el hito de 90 días, “Verificado” y Didit/RENAPER.
- El pedido actual amplía el alcance del 033 solo para preparar los elementos visuales mock del retiro. Las cuatro exclusiones de Innovación 1 en el pedido actual —SENAF, hito de 90 días, estado “Verificado” e integración Didit/RENAPER— se mantienen fuera.
- `TAREAS-INNOVACION-1-POR-INTEGRANTE.md` no existe en el repositorio. Los cinco estados exactos y la separación entre error del proveedor e identidad fallida están documentados en `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`, `TAREAS-PENDIENTES-SOFI.md` y `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md`.
- La documentación describe estos cinco estados RNF-12:
  1. `Pendiente de verificación`
  2. `Identidad verificada`
  3. `Identidad no verificada`
  4. `Requiere revisión`
  5. `Error del proveedor`
- `DECISIONES-PENDIENTES-INNOVACIONES.md` distingue `Error del proveedor` (problema al crear sesión, no consume un intento) de `Identidad no verificada` (resultado fallido). Los badges usarán esos nombres sin inferir estados adicionales.
- No existe pantalla, tabla, ruta, ni componente de retiros en la UI actual. `app/(dashboard)/nnya/[id]/page.tsx` muestra tutores reales vinculados, pero solo conoce `es_principal`; esa propiedad no equivale a autorización para retirar.
- La autorización para retirar, su vigencia y las restricciones todavía no existen en el modelo. `TAREAS-PENDIENTES-SOFI.md` y el informe de validación lo confirman. La lista presentada será exclusivamente un fixture demostrativo, no una afirmación de reglas de negocio ni de datos reales.
- `components/ui/badge.tsx` es la primitiva de Badge vigente y ya ofrece variantes tokenizadas `success`, `warning`, `destructive`, `secondary`, `info` y `outline`.
- `/alertas` ya consulta y muta alertas reales mediante hooks. La demo educativa se añadirá en una sección separada, sin compartir sus listas, formularios, estado ni mutaciones.
- La ruta `/retiros-demo` dentro de `(dashboard)` heredaría el layout actual: `proxy.ts` valida la sesión con Supabase y el sidebar consulta conteos globales de alertas/propuestas. No se añadirán consultas de negocio de retiro; si “sin Supabase” debe incluir también autenticación y conteos compartidos de navegación, habría que acordar otro tratamiento de ruta/layout antes de implementar.
- No existe `.claude/skills/` en el workspace.

## 3. Archivos y documentación inspeccionados

- `AGENTS-WEB.md`, `CLAUDE.md`, `docs/design-system.md`.
- `prompts/033-frontend-innovaciones-cami.md`, `prompts/018-frontend-innovaciones-cami.md`.
- `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`, `TAREAS-PENDIENTES-SOFI.md`, `DECISIONES-PENDIENTES-INNOVACIONES.md`, `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md`.
- `prompts/028-qa-didit-retiro.md`, `prompts/029-qa-testing-integraciones-meli.md`.
- `app/(dashboard)/nnya/[id]/page.tsx`, `app/(dashboard)/alertas/page.tsx`, `app/(dashboard)/legajos/[id]/page.tsx`, `app/(dashboard)/layout.tsx`.
- `components/ui/badge.tsx`, `components/entities/tutores/TutorTable.tsx`, `components/entities/referentes/ValidarRenaperForm.tsx`, `hooks/referentes/useCreateValidacionRenaper.ts`.
- `proxy.ts`, `app/layout.tsx`, `package.json`.

## 4. Skills utilizadas

No hay skills relevantes instaladas en `.claude/skills/`.

## 5. Supuestos y decisiones

- Los elementos de retiro se mostrarán en una ruta dedicada de demostración, sin cargar datos reales de NNyA ni tutores. No se agregará una opción de navegación que pueda confundirse con un módulo operativo.
- Se conserva la autenticación y el layout actuales del dashboard; las consultas globales que ese layout ya realiza no alimentarán los componentes demo ni se modificarán en esta tarea.
- Los ejemplos de tutor, vínculo, autorización, vigencia y restricciones llevarán una marca de datos ficticios. Los valores describen solamente la maqueta y no implementan ni anticipan reglas de autorización.
- El formulario de ausencia educativa solo actualizará estado React local y se reiniciará al recargar.
- El registro de retiro será únicamente visual; horas y estado “Realizada” provendrán del fixture, sin acciones de persistencia.
- La expresión “los 4 ajustes” del pedido se aplica manteniendo fuera los cuatro temas listados expresamente: SENAF, hito de 90 días, estado “Verificado” y Didit/RENAPER real.
- PR #24 no se pudo consultar en GitHub (la API respondió 404); esto no altera los requisitos locales explícitos del Plan 033.

## 6. Archivos a crear

- `components/entities/nnya/TimelineNnyaDemo.tsx`
- `components/entities/nnya/timeline-demo-data.ts` — fixture local de eventos ficticios.
- `components/entities/alertas/AlertasEducativasDemo.tsx`
- `components/entities/alertas/alertas-educativas-demo-data.ts` — ejemplos ficticios, separados de alertas reales.
- `components/entities/retiros/TutoresAutorizadosDemo.tsx`
- `components/entities/retiros/EstadoVerificacionBadge.tsx`
- `components/entities/retiros/RetiroDemo.tsx`
- `components/entities/retiros/demo-data.ts` — fixtures ficticios, separados del código operativo.
- `app/(dashboard)/retiros-demo/page.tsx` — composición visual aislada, marcada como demostración.
- `tests/unit/innovacion1-demo.test.ts` — pruebas de fixtures y presentación pura compatible con el runner actual.

## 7. Archivos a modificar

- `app/(dashboard)/nnya/[id]/page.tsx` — incorporar Timeline demo sin usar sus datos reales.
- `app/(dashboard)/alertas/page.tsx` — incorporar una sección educativa demo separada del flujo real.

No modificar `hooks/referentes/useCreateValidacionRenaper.ts`, endpoints, `proxy.ts`, layouts compartidos, tipos de Supabase ni archivos de base de datos.

## 8. Requisitos de implementación

### 8.1 Timeline NNyA (Plan 033)

- Sección inequívocamente identificada: “Demostración — datos ficticios; no representa el historial real de este NNyA.”
- Tres a cinco eventos ficticios y neutros, ordenados cronológicamente; sin nombres, DNI, expediente ni observaciones sensibles.
- No combinar eventos fixture con las consultas del detalle de NNyA.

### 8.2 Alertas educativas (Plan 033)

- Sección separada e identificada como “Demostración de alertas educativas”.
- Permitir cargar una ausencia ficticia con fecha, motivo y descripción opcional.
- Mostrar la entrada local y ejemplos ficticios de alertas educativas con estado, fecha y descripción.
- Mantener el formulario y las listas demo en estado React local. No llamar hooks de Supabase, mutaciones reales ni persistencia de navegador.
- Mantener intactas las alertas reales y sus acciones.

### 8.3 Tutores autorizados (Innovación 1, demo)

- Mostrar nombre ficticio, vínculo, estado de autorización, vigencia y restricciones cuando corresponda.
- Incluir una indicación visible de que toda la información es de demostración.
- No derivar autorización de `es_principal`; no consultar Supabase y no introducir reglas, cálculos de vigencia ni criterios de restricción.
- Exponer restricciones de forma visible, no solo mediante tooltip, color o interacción secundaria.

### 8.4 Badges RNF-12 (Innovación 1, demo)

- Reutilizar `Badge` de `components/ui/badge.tsx`; no crear una primitiva paralela ni alterar badges existentes.
- Mostrar los cinco nombres documentados exactamente.
- Asignar variantes de forma que los cinco resultados se distingan con texto además del color; en particular `Error del proveedor` no se verá igual que `Identidad no verificada`.
- Acompañar el badge de error del proveedor con texto accesible/visible que explique que el fallo corresponde al proveedor y no consume un intento; la identidad no verificada representa un resultado fallido. No crear lógica de conteo ni estados técnicos nuevos.
- Mantener una composición que no dependa de anchos fijos y que se adapte a desktop/tablet.

### 8.5 Registro visual de retiro (Innovación 1, demo)

- Mostrar hora de inicio, hora de finalización y estado “Realizada”.
- Presentar inicio y finalización como datos diferenciados y legibles.
- Usar exclusivamente fixture ficticio; no crear, cerrar ni persistir retiros.

### 8.6 Exclusiones expresas

- No SENAF, hito de 90 días ni estado “Verificado”.
- No crear pantalla final de identidad, consentimiento ni selección del dispositivo de verificación.
- No inventar endpoints, payloads, errores técnicos, roles, polling ni respuestas del proveedor.
- No integrar Didit/RENAPER, webhook ni Supabase para la funcionalidad de retiro.
- No reemplazar ni modificar `useCreateValidacionRenaper`.
- No alterar backend, RLS, tipos, migraciones ni reglas de negocio; no añadir dependencias.

## 9. Seguridad y privacidad

- Usar fixtures claramente ficticios y no incluir datos personales reales.
- No pasar datos reales del NNyA/tutores a los componentes de retiro.
- No enviar ni almacenar DNI, imagen, selfie, biometría, credenciales o datos del proveedor.
- Las acciones demo no deben afectar alertas o entidades reales, ni escribir en base o `localStorage`.
- Mantener intactos los controles actuales de acceso y la separación entre datos reales y demo.

## 10. Criterios de aceptación

- El detalle de NNyA muestra de tres a cinco eventos ficticios y una advertencia clara sin alterar sus datos reales.
- `/alertas` conserva sus flujos reales y muestra aparte una demo educativa con carga de ausencia solo local.
- La ruta demo de retiro presenta tutores, estados de autorización, vigencia y restricciones claramente marcados como ficticios, además del registro de retiro.
- Los cinco badges muestran los nombres exactos y diferencian de manera comprensible error del proveedor de identidad no verificada.
- No se dispara ninguna query o mutation específica de Supabase desde los componentes de demostración; no se cambia el hook existente de RENAPER.
- No se modifican backend, endpoints, Supabase, tipos, migraciones, dependencias ni estados fuera de los cinco definidos.
- El diseño mantiene accesibilidad básica (texto explícito, estados no diferenciados solo por color, controles etiquetados) y responde en tablet y desktop.

## 11. Chequeos y verificación manual

Después de la aprobación y la implementación:

- `npm run test:unit`
- `npx tsc --noEmit`
- `npm run build`
- `npm run lint`
- Revisar manualmente `/nnya/[id]`, `/alertas` y `/retiros-demo` en desktop y viewport tablet.
- Confirmar visualmente que los datos ficticios no se mezclen con datos reales, que las restricciones estén expuestas, que la distinción de los dos estados sea inequívoca y que la ausencia desaparezca al recargar.
- Revisar `git status --short`, `git diff --stat` y `git diff --check`.

## 12. Estado de aprobación

Este plan amplía el alcance del Plan 033 vigente y recorta el issue #26 a demos visuales. No se implementará código hasta recibir aprobación explícita (“✓ Aprobado”) o instrucciones de cambio (“✕ Cambiar X”), conforme a `AGENTS-WEB.md`.
