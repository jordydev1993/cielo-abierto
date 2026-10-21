# 034 — Demos frontend para Innovación 1 y continuidad del Plan 033

**Estado (actualizado 2026-10-16):** Demos frontend navegables; retiros reales e integración Didit pendientes.
**Fecha del relevamiento:** 2026-10-08
**Alcance:** demostraciones frontend aisladas para el issue #26 y las dos demos aún autorizadas por el Plan 033. Sin integración ni persistencia real.

> **Actualización 2026-10-16:** este documento conserva abajo el alcance histórico del relevamiento del 08/10. La aclaración de la responsable frontend amplió la maqueta: `/timeline-nnya-demo` y `/alertas-educativas-demo` son rutas separadas; `/retiros-demo` ahora presenta un recorrido visual navegable de consentimiento, QR/tablet, estados, revisión Admin, registro y cierre; Referentes abre la vista «Validar identidad» y los vínculos nuevos/propuestos permanecen en `propuesto`. Los mocks no guardan datos ni habilitan operaciones reales. La consulta/creación de sesiones, resultados, intentos, auditoría, autorización de tutores y persistencia siguen dependiendo de Sofi/Meli. Los mensajes A–D literales no están disponibles en las fuentes del repo.

> También se aplicaron las sugerencias no bloqueantes del review de PR #42: “Identidad no verificada” indica que consume un intento; “Requiere revisión” aclara los tres intentos agotados y la espera de Admin; la demo educativa distingue ausencias justificadas, sin calcular ni generar alertas reales (D-30).

## 1. Objetivo

Documentar las demos frontend implementadas para el retiro visual, el Timeline de NNyA y las alertas educativas. No representan una pantalla o flujo real de retiro ni completan la integración de verificación de identidad.

El código de demostración se mantendrá separado de las consultas y mutaciones reales. No se conectará Didit ni RENAPER, ni se modificará `useCreateValidacionRenaper`.

## 2. Contexto verificado

- El issue #26 corresponde al trabajo frontend de retiros reales. Esta rama contiene únicamente una demo visual de retiro y sus componentes; no implementa el flujo real ni Didit.
- `prompts/033-frontend-innovaciones-cami.md` documenta las demos ya implementadas de Timeline y alertas educativas. SENAF demo, el hito de 90 días, “Verificado” y Didit/RENAPER real siguen fuera de alcance.
- La demo de retiro amplía solo la presentación visual, sin consulta ni persistencia operativa.
- `TAREAS-INNOVACION-1-POR-INTEGRANTE.md` está disponible en esta rama. Los cinco estados exactos y la distinción entre error del proveedor e identidad fallida también se describen en `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`, `TAREAS-PENDIENTES-SOFI.md` e `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md`.
- La documentación describe estos cinco estados RNF-12:
  1. `Pendiente de verificación`
  2. `Identidad verificada`
  3. `Identidad no verificada`
  4. `Requiere revisión`
  5. `Error del proveedor`
- `DECISIONES-PENDIENTES-INNOVACIONES.md` distingue `Error del proveedor` (problema al crear sesión, no consume un intento) de `Identidad no verificada` (resultado fallido). Los badges de la demo usan esos nombres sin inferir estados adicionales.
- El documento `prompts/033-requisitos-contrato-didit.md` de la rama separada de Meli se revisó como plan/borrador: se identifica con la tarjeta #23, declara que los endpoints no existen y marca decisiones abiertas. No acredita que exista un contrato final asociado a la tarjeta #30 ni habilita a tratar sus rutas o formatos propuestos como endpoints disponibles. No se hizo merge ni cherry-pick de esa rama.
- QR en el celular, consentimiento y atención Admin de “Requiere revisión” están definidos por D-19, D-24, D-25 y D-26 y maquetados como mocks. La sesión, consulta del resultado y acciones reales siguen pendientes de endpoints.
- No existe pantalla, tabla, ruta, ni componente de retiros en la UI actual. `app/(dashboard)/nnya/[id]/page.tsx` muestra tutores reales vinculados, pero solo conoce `es_principal`; esa propiedad no equivale a autorización para retirar.
- La autorización para retirar, su vigencia y las restricciones todavía no existen en el modelo. `TAREAS-PENDIENTES-SOFI.md` y el informe de validación lo confirman. La lista presentada será exclusivamente un fixture demostrativo, no una afirmación de reglas de negocio ni de datos reales.
- `components/ui/badge.tsx` es la primitiva de Badge vigente y ya ofrece variantes tokenizadas `success`, `warning`, `destructive`, `secondary`, `info` y `outline`.
- `/alertas` consulta y muta alertas reales; la demo educativa está en `/alertas-educativas-demo`, sin compartir listas, formularios, estado ni mutaciones.
- La ruta `/retiros-demo` dentro de `(dashboard)` hereda el layout actual: `proxy.ts` valida la sesión con Supabase y el sidebar consulta conteos globales de alertas/propuestas. La demo no añade consultas de negocio de retiro; esta autenticación y navegación compartida no constituyen integración de retiros.
- No existe `.claude/skills/` en el workspace.

## 3. Archivos y documentación inspeccionados

- `AGENTS-WEB.md`, `CLAUDE.md`, `docs/design-system.md`.
- `prompts/033-frontend-innovaciones-cami.md` y el contenido histórico del plan 018 antes de su eliminación.
- `TAREAS-PENDIENTES-DIDIT-POR-INTEGRANTE.md`, `TAREAS-PENDIENTES-SOFI.md`, `DECISIONES-PENDIENTES-INNOVACIONES.md`, `INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md`.
- Los prompts 028 y 029 relacionados con QA se excluyeron intencionalmente de esta rama y no deben restaurarse como parte de esta tarea.
- `app/(dashboard)/nnya/[id]/page.tsx`, `app/(dashboard)/alertas/page.tsx`, `app/(dashboard)/legajos/[id]/page.tsx`, `app/(dashboard)/layout.tsx`.
- `components/ui/badge.tsx`, `components/entities/tutores/TutorTable.tsx`, `components/entities/referentes/ValidarRenaperForm.tsx`, `hooks/referentes/useCreateValidacionRenaper.ts`.
- `proxy.ts`, `app/layout.tsx`, `package.json`.

## 4. Skills utilizadas

No hay skills relevantes instaladas en `.claude/skills/`.

## 5. Supuestos y decisiones

- Los elementos de retiro se mostrarán en una ruta dedicada de demostración, sin cargar datos reales de NNyA ni tutores. No se agregará una opción de navegación que pueda confundirse con un módulo operativo.
- Se conserva la autenticación y el layout actuales del dashboard; las consultas globales que ese layout ya realiza no alimentarán los componentes demo ni se modificarán en esta tarea.
- Los ejemplos de tutor, vínculo, autorización, vigencia y restricciones llevan una marca de datos ficticios. Los valores describen solamente la maqueta y no implementan ni anticipan reglas de autorización.
- El formulario de ausencia educativa solo actualiza estado React local y se reinicia al recargar.
- El registro de retiro es únicamente visual; «Editar» muestra el cierre local con hora de regreso y estado “Realizada”, sin persistencia.
- La expresión “los 4 ajustes” del pedido se aplica manteniendo fuera los cuatro temas listados expresamente: SENAF, hito de 90 días, estado “Verificado” y Didit/RENAPER real.
- PR #24 no se pudo consultar en GitHub (la API respondió 404); esto no altera los requisitos locales explícitos del Plan 033.

## 6. Archivos implementados

- `components/entities/nnya/TimelineNnyaDemo.tsx`
- `components/entities/nnya/timeline-demo-data.ts` — fixture local de eventos ficticios.
- `components/entities/alertas/AlertasEducativasDemo.tsx`
- `components/entities/alertas/alertas-educativas-demo-data.ts` — ejemplos ficticios, separados de alertas reales.
- `components/entities/retiros/TutoresAutorizadosDemo.tsx`
- `components/entities/retiros/EstadoVerificacionBadge.tsx`
- `components/entities/retiros/RetiroDemo.tsx`
- `components/entities/retiros/demo-data.ts` — fixtures ficticios, separados del código operativo.
- `app/(dashboard)/retiros-demo/page.tsx` — composición visual aislada, marcada como demostración.
- `tests/unit/innovacion1-demo.test.ts` — pruebas de fixtures y sus propiedades compatibles con el runner actual.

## 7. Archivos modificados

- `app/(dashboard)/nnya/[id]/page.tsx` — incorpora Timeline demo sin usar sus datos reales.
- `app/(dashboard)/alertas/page.tsx` — incorpora una sección educativa demo separada del flujo real.

No se modificaron `hooks/referentes/useCreateValidacionRenaper.ts`, endpoints, `proxy.ts`, layouts compartidos, tipos de Supabase ni archivos de base de datos para estas demos.

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
- La pantalla real de identidad, el consentimiento y la selección del dispositivo de verificación no están implementados en esta demo.
- No inventar endpoints, payloads, errores técnicos, roles, polling ni respuestas del proveedor.
- No integrar Didit/RENAPER, webhook ni Supabase para la funcionalidad de retiro.
- La interfaz ya no invoca `useCreateValidacionRenaper`; el hook se conserva sin uso desde esta pantalla mientras la integración Didit no tenga contrato.
- No alterar backend, RLS, tipos, migraciones ni reglas de negocio; no añadir dependencias.

### 8.7 Dependencias pendientes para retiros reales

- La rama `meli/requisitos-contrato-didit` contiene un borrador de contrato identificado allí como tarjeta #23, no evidencia de un contrato final para la tarjeta #30. El propio documento indica que los endpoints son planificados y no están implementados. La rama permanece separada y sus cambios no forman parte de esta demo.
- No considerar disponible el contrato de #30 hasta verificar documentación final publicada y confirmar explícitamente su alcance.
- QR en el celular, consentimiento y la responsabilidad/flujo de revisión manual para “Requiere revisión” requieren definición y posterior implementación real; las decisiones pendientes del borrador no se resuelven con los mocks de esta rama.

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
- Los cinco badges muestran los nombres exactos y diferencian error del proveedor de identidad no verificada; A-D literal no disponible en los archivos del repo.
- No se dispara ninguna query o mutation específica de Supabase desde los componentes de demostración; no se cambia el hook existente de RENAPER.
- No se modifican backend, endpoints, Supabase, tipos, migraciones, dependencias ni estados fuera de los cinco definidos.
- El diseño mantiene accesibilidad básica (texto explícito, estados no diferenciados solo por color, controles etiquetados) y responde en tablet y desktop.

## 11. Chequeos y verificación manual

Para validar la demo implementada:

- `npm run test:unit`
- `npx tsc --noEmit`
- `npm run build`
- `npm run lint`
- Revisar manualmente `/nnya/[id]`, `/alertas`, `/timeline-nnya-demo`, `/alertas-educativas-demo`, `/retiros-demo` y el flujo de referentes en desktop y viewport tablet.
- Confirmar visualmente que los datos ficticios no se mezclen con datos reales, que las restricciones estén expuestas, que la distinción de los dos estados sea inequívoca y que la ausencia desaparezca al recargar.
- Revisar `git status --short`, `git diff --stat` y `git diff --check`.

## 12. Estado de implementación

Las demos de Timeline y alertas educativas están aisladas en rutas propias. `/retiros-demo` y la acción de referentes incluyen las vistas de consentimiento, selección de dispositivo, espera, estados y fallback de ejemplo. Ninguna equivale a la implementación del flujo real de retiros ni de Didit.
