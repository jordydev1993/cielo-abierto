# 043 — Correcciones del PR #42: validación manual y estado Vigente

## Objetivo

Restaurar la validación manual de identidad en `/referentes`, mantener la demostración de Didit aislada y disponible sin sustituir la acción manual, y permitir elegir el estado `Vigente` en creación y edición de vínculos de tutela.

## Contexto

La rama actual conecta la acción de identidad de `/referentes` con `DiditIdentityFlow`. La pantalla anterior al commit `41ba0eb` abría `ValidarRenaperForm` y guardaba el registro con `useCreateValidacionRenaper`. Ambos componentes y servicios continúan en el repositorio.

En `VinculoTutelaForm`, la opción `Vigente` tiene `disabled={initialData?.estado !== 'vigente'}`, impidiendo seleccionarla en altas y al editar vínculos que no estén ya vigentes. El formulario comparte esta condición para creación y edición.

## Archivos inspeccionados

- `app/(dashboard)/referentes/page.tsx`
- `components/entities/referentes/ReferenteTable.tsx`
- `components/entities/referentes/ValidarRenaperForm.tsx`
- `hooks/referentes/useCreateValidacionRenaper.ts`
- `hooks/referentes/useUltimaValidacionRenaper.ts`
- `lib/validations/validaciones-renaper.schema.ts`
- `components/entities/retiros/DiditIdentityFlow.tsx`
- `components/entities/vinculos-tutela/VinculoTutelaForm.tsx`
- `components/entities/vinculos-tutela/VinculoTutelaList.tsx`
- `hooks/vinculos-tutela/useCreateVinculoTutela.ts`
- `hooks/vinculos-tutela/useUpdateVinculoTutela.ts`
- `lib/validations/vinculos-tutela.schema.ts`
- `supabase/migrations/20260827000033_create_tutela_evaluacion_turnos_seguimiento.sql`
- Historial Git del commit `41ba0eb` y su versión padre para la página y tabla de Referentes.
- `components/shared/DataTable.tsx` y `package.json`.

## Skills utilizadas

No se encontraron skills del proyecto: `.claude/skills/` no existe en esta copia.

## Supuestos

- La acción manual debe seguir registrando una validación con el formulario y el hook existentes; no equivale a consultar RENAPER en vivo.
- Didit puede seguir mostrándose como demostración, pero debe tener una acción separada que no reemplace ni interfiera con el flujo manual.
- El cambio de `Vigente` es de interfaz solamente; no se cambian reglas, hooks, políticas ni migraciones de servidor.

## Archivos a crear/modificar

- Modificar `app/(dashboard)/referentes/page.tsx` para recuperar el formulario, hook, feedback y cierre del flujo manual, conservando Didit como demo separada.
- Modificar `components/entities/referentes/ReferenteTable.tsx` para exponer por separado las acciones manual y demo, accesibles desde cada referente.
- Modificar `components/entities/vinculos-tutela/VinculoTutelaForm.tsx` para quitar la condición `disabled` únicamente de la opción `Vigente`.
- Crear este plan en `prompts/043-restaurar-validacion-manual-y-habilitar-vigente.md`.

## Requisitos

1. La acción manual vuelve a estar disponible en `/referentes` y registra los datos mediante `useCreateValidacionRenaper`.
2. La demostración Didit sigue identificada como demo y no sustituye el formulario ni registra una validación real.
3. `Vigente` puede elegirse al crear y editar un vínculo. Las restricciones de las otras opciones y las validaciones permanecen sin cambios.
4. Ningún endpoint, permiso, política RLS, trigger, migración o regla del servidor se modifica.
5. No se alteran las demos de Timeline, Alertas Educativas ni las pantallas demo de Innovación 1 fuera de la convivencia requerida en Referentes.

## Seguridad

- Mantener `AccessGuard` y el servicio/hook existentes.
- La base impone el índice único parcial `uq_vinculo_vigente_por_nnya` en `vinculos_tutela(nnya_id) WHERE estado = 'vigente'`; por tanto, aunque la opción pueda seleccionarse, guardar un segundo vínculo vigente para el mismo NNyA será rechazado por la base. No se cambiará esa restricción.
- No crear endpoints ni presentar el flujo demo como una validación real.

## Criterios de aceptación

- `/referentes` ofrece una acción manual distinguible y el formulario registra la validación por el hook existente.
- La demostración Didit continúa accesible como demo independiente y no interfiere con el registro manual.
- En formularios nuevos y existentes, `Vigente` no tiene una condición `disabled`.
- El resto de estados, validaciones y comportamiento de backend queda intacto.

## Chequeos

- `npx tsc --noEmit`
- `npm run lint`
- `npm run test:unit`
- `npm run build`

## Verificación manual

1. Abrir `/referentes` con un usuario autorizado y confirmar que están disponibles las acciones manual y demo.
2. Abrir la acción manual, completar el formulario y registrar una validación; confirmar el toast de éxito y que el registro aparezca en “Última validación registrada”.
3. Abrir la demo Didit y confirmar que se identifica como demostración y no reemplaza el registro manual.
4. En un legajo, abrir el formulario para crear un vínculo y comprobar que se puede seleccionar `Vigente`; repetir en la edición de un vínculo no vigente.
5. Intentar guardar `Vigente` cuando ya existe otro vínculo vigente para ese NNyA y confirmar que la restricción existente de base se informa, sin alterar la regla.
