# 044 — Correcciones de demos Didit, vínculos y mensajes de retiro

## Objetivo

Retirar la demostración Didit de la pantalla real de referentes, ubicarla en una pestaña ficticia de `/retiros-demo`, restaurar el selector de estados de vínculos como en `master` y presentar los mensajes de retiro solo con el copy literal aprobado por D-33 y el contrato actualizado.

## Contexto

La rama inspeccionada es `feat/demos-innovaciones` (`edf79e2`), con el árbol de trabajo limpio al iniciar el relevamiento.

`/referentes` contiene una acción demo que recibe el `Referente` real y muestra su nombre en el diálogo. La validación manual existente usa `ValidarRenaperForm` y `useCreateValidacionRenaper`, con toast y manejo de errores.

`/retiros-demo` ya es una pantalla de demostración señalizada, basada en datos ficticios y sin persistencia. `DiditIdentityFlow` admite `proposito="retiro"` y `proposito="referente"`. La librería Radix Tabs y el wrapper `components/ui/tabs.tsx` existen, por lo que es posible separar los dos recorridos en pestañas sin cambiar el flujo del retiro.

`VinculoTutelaForm.tsx` tiene restricciones `disabled` para `Propuesto`, `Finalizado` y `Revocado`, y un texto de ayuda sobre la aprobación/Integración Didit. La versión en `master` presenta los cuatro estados habilitados y no muestra ese texto. La versión actual no contiene las restricciones de `Vigente` descritas en un plan previo.

**Bloqueo de copy:** no se encontró D-33 ni sus mensajes en `DECISIONES-PENDIENTES-INNOVACIONES.md`. El §7.4 de `prompts/035-requisitos-contrato-didit.md` dice explícitamente que los literales A–D no están disponibles y que el copy de los códigos adicionales sigue pendiente. `docs/testingManual/QA-DIDIT-RETIRO.md` identifica casos de prueba (A-01, B-01, C-01, D-01), no el copy de los mensajes. Por lo tanto, la implementación literal de mensajes no puede completarse con los archivos presentes.

## Archivos inspeccionados

- `AGENTS-WEB.md`
- `app/(dashboard)/referentes/page.tsx`
- `components/entities/referentes/ReferenteTable.tsx`
- `components/entities/retiros/DiditIdentityFlow.tsx`
- `components/entities/retiros/RetiroDemo.tsx`
- `components/entities/retiros/demo-data.ts`
- `components/entities/retiros/InnovacionDemoNavigation.tsx`
- `components/ui/tabs.tsx`
- `components/entities/vinculos-tutela/VinculoTutelaForm.tsx`
- Versión de `VinculoTutelaForm.tsx` en `master`
- `DECISIONES-PENDIENTES-INNOVACIONES.md`
- `prompts/035-requisitos-contrato-didit.md` §7.4
- `docs/testingManual/QA-DIDIT-RETIRO.md`
- `package.json`

## Skills utilizadas

No se encontraron skills del proyecto: `.claude/skills/` no existe en esta copia.

## Supuestos

- La demo de referente será solo visual, con `DiditIdentityFlow proposito="referente"` y sin recibir ni mostrar objetos reales de `Referente`.
- La pestaña actual de retiro conservará el contenido y comportamiento existentes de `RetiroDemo` sin cambiar la integración (actualmente no hay integración real).
- No se implementarán transiciones de estado de vínculos en frontend, ni cambios de base, migraciones o políticas.
- La implementación de mensajes funcionales queda bloqueada hasta disponer de D-33 y del copy literal aprobado para cada escenario. No se usarán IDs de casos QA para ramificar mensajes, ni códigos del envelope que Plan 035 marca como propuesta.

## Archivos a crear/modificar

- Modificar `components/entities/referentes/ReferenteTable.tsx`: eliminar `onDemoDidit`, el botón y su importación `QrCode`.
- Modificar `app/(dashboard)/referentes/page.tsx`: quitar únicamente el estado, imports y diálogo demo; conservar intactos el diálogo manual RENAPER, su hook, toast, validación y errores.
- Modificar `app/(dashboard)/retiros-demo/page.tsx`: presentar el flujo de retiro existente y la demo de referente en pestañas; marcar ambas como demostración y montar `DiditIdentityFlow proposito="referente"` sin datos reales.
- Modificar `components/entities/vinculos-tutela/VinculoTutelaForm.tsx`: habilitar los cuatro estados como en `master` y quitar exclusivamente el texto de ayuda sobre la integración Didit; mantener el resto de validaciones.
- Modificar `components/entities/retiros/DiditIdentityFlow.tsx` y/o `components/entities/retiros/RetiroDemo.tsx` para renderizar mensajes de escenarios únicamente cuando se provea el literal de D-33 y se confirme el estado/condición correspondiente. **No implementar esta parte hasta recibir la fuente literal.**
- Este archivo de plan.

## Requisitos

1. `/referentes` no expone acciones de demo ni vincula Didit con registros reales.
2. La validación manual RENAPER conserva su formulario, guardado, toasts y tratamiento de errores.
3. `/retiros-demo` ofrece una pestaña `Referente`, muestra solo elementos ficticios y no realiza operaciones de persistencia.
4. El flujo existente de retiro conserva su comportamiento, bajo una pestaña propia.
5. Los estados `Propuesto`, `Vigente`, `Finalizado` y `Revocado` pueden seleccionarse al crear y editar. No se agregan reglas nuevas.
6. Cada escenario usa su mensaje literal D-33/Plan 035, asociado a su condición y no al identificador del caso QA. La implementación espera la fuente ausente.
7. No modificar documentos de decisiones/QA, backend, reglas de negocio, migraciones, RLS ni funcionalidades ajenas.

## Seguridad

- Ningún referente real se pasa a la demo ni aparece en `/retiros-demo`.
- No agregar lecturas/escrituras de Supabase al recorrido demo ni habilitar operaciones reales.
- Mantener el copy de retiro bloqueado hasta verificar literal y estado contractual; no inferirlo de los IDs QA ni de la propuesta de envelope.

## Criterios de aceptación

- No existe el botón ni el diálogo Didit en `/referentes`; sí permanecen la validación manual y su feedback.
- `/retiros-demo` separa las demostraciones en pestañas y la pestaña `Referente` monta `DiditIdentityFlow` con propósito referente y datos únicamente ficticios.
- La pestaña de retiro conserva el flujo de demostración actual.
- Los cuatro estados del vínculo no tienen restricciones de selección adicionales y no se muestra la ayuda de integración Didit no implementada.
- El copy de cada escenario se implementa solo después de proporcionar y verificar los literales aprobados. Si no se proporcionan, no se inventa texto y la Tarea 3 se informa pendiente.
- Se ejecutan `npm run lint`, `npx tsc --noEmit` y `npm run test:unit`; se informa cada resultado.

## Chequeos

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:unit`

## Verificación manual

1. Abrir `/referentes`: comprobar que no hay botón ni diálogo de demo; abrir la validación manual, comprobar el formulario y que el guardado sigue informando éxito/error con toast.
2. Abrir `/retiros-demo`: confirmar que la pestaña `Referente` muestra solo el flujo demo y que no aparecen datos de referentes reales; recorrer la pestaña de retiro y confirmar que conserva sus controles.
3. Crear y editar un vínculo: comprobar que los cuatro estados están disponibles, sin cambiar otras validaciones.
4. Cuando se proporcione el copy D-33, recorrer cada estado definido en el contrato y verificar su mensaje literal y condición, sin conectar Didit ni persistir datos.
