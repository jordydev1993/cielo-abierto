# 037 — Reglas de estado del legajo en la base (opción A)

**Tarjeta:** sin tarjeta (pendiente del panel: "Estados de legajo") — Jordy — Media
**Estado:** borrador, esperando aprobación de Jordy. Opción A elegida el 2026-10-10.

## Objetivo

Hacer cumplir en la base las reglas del proceso que protegen la historia del caso, sin agregar estados nuevos:

- el legajo nace `activo`;
- solo se puede pasar de `activo` a `cerrado`, y de `cerrado` a `archivado` (12 meses después del cierre);
- nunca se reactiva;
- un legajo `cerrado` o `archivado` es de solo lectura.

"En incidente" se muestra como **indicador**, no como estado. "En evaluación" queda fuera de alcance, documentado.

## Contexto

**Lo que pide el proceso** (`documentacion/procesos-del-negocio.md` § 5, del Encuentro 6): Activo → Cerrado con informe de egreso aprobado; Cerrado → Archivado a los 12 meses; prohibido Activo → Archivado, Cerrado → Activo y salir de Archivado; prohibido modificar un legajo cerrado o archivado. También describe "En incidente" (con firma dual para volver) y "En evaluación".

**Lo que hace hoy el sistema** (verificado el 10/10):

- `legajos.estado` admite `activo`, `cerrado` y `archivado`, sin reglas de transición. El único trigger es el de auditoría.
- El diálogo de cierre (`app/(dashboard)/legajos/[id]/page.tsx`) ofrece "Cerrado" y "Archivado": deja archivar sin cerrar.
- `useCerrarLegajo` exige un informe de tipo `Egreso` (L-EX-10) y que no haya incidentes `abierto` o `en_seguimiento` (L-EX-13). **Pero la app no permite cambiar el estado de un incidente:** nacen `abierto` y así quedan. Un legajo con incidentes nunca se puede cerrar.
- Esas dos validaciones viven solo en el cliente.

**Datos en producción** (solo lectura): 5 legajos, 4 `activo` y 1 `cerrado` (fecha de cierre 2025-01-10, sin motivo). El legajo `LEG-2023-015` sigue `activo` aunque su NNyA está `Egresado`: tiene 1 incidente `abierto` y no tiene informe de egreso, así que hoy no se puede cerrar desde la app.

## Cambio propuesto

### 1. Migración: trigger de reglas de estado en `legajos`

`fn_legajos_reglas_estado()`, `BEFORE INSERT OR UPDATE`, `SET search_path = public`:

- **INSERT:** `estado` tiene que ser `activo` ("no puede nacer cerrado").
- **UPDATE desde `archivado`:** rechazado siempre.
- **UPDATE desde `cerrado`:** solo se acepta el cambio a `archivado`, con `fecha_cierre <= CURRENT_DATE - INTERVAL '12 months'`. Cualquier otra columna que cambie (salvo `updated_at`) se rechaza: solo lectura.
- **UPDATE de `activo` a `cerrado`:** exige `motivo_cierre` no vacío; la base fija `fecha_cierre = CURRENT_DATE`.
- **Cualquier otra transición** (`activo` → `archivado`, `cerrado` → `activo`): rechazada, con un mensaje claro.

El legajo cerrado existente no se toca: el trigger actúa sobre cambios futuros.

### 2. Incidentes: poder resolverlos

Sin esto, L-EX-13 bloquea para siempre el cierre de cualquier legajo con incidentes. En el listado o formulario de incidentes:

- cambiar el estado `abierto` → `en_seguimiento` → `cerrado`;
- pasar a `cerrado` exige completar `acciones_tomadas`.

La firma dual del proceso (Trabajador Social + Director) queda fuera de alcance: hoy no existen esos roles (D-2, D-10). El cambio queda en el `audit_log` con el usuario.

### 3. Pantalla del legajo

- El diálogo de cierre ofrece solo "Cerrado".
- Un legajo `cerrado` muestra "Archivar", habilitado solo si pasaron 12 meses desde el cierre; si no, el motivo ("Se puede archivar desde el DD/MM/AAAA").
- "Editar" solo aparece en legajos `activo` (hoy ya es así; se confirma).
- `useCerrarLegajo` deja de mandar `fecha_cierre` (la fija la base) y traduce los errores del trigger.
- Nuevo `useArchivarLegajo`.

### 4. Indicador "Incidente pendiente"

En el listado de legajos y en la ficha, un badge cuando el NNyA tiene una alerta de tipo `incidente` en `pendiente` o `en_proceso` (la que crea `trg_alerta_incidente_grave` ante un incidente grave o crítico). Se apaga cuando la alerta se resuelve. Hoy hay 1 alerta así.

## Archivos inspeccionados

- `supabase/migrations/20260620000031_clean_schema.sql` (definición de `legajos`, `uq_legajo_activo_por_nnya`, `fn_crear_alerta_incidente_grave`).
- Producción, solo lectura: columnas y triggers de `legajos`, estados de legajos e incidentes, `CHECK` de `informes` e `incidentes`, alertas de tipo `incidente`.
- `app/(dashboard)/legajos/[id]/page.tsx`, `hooks/legajos/useUpdateLegajo.ts`, `lib/validations/legajos.schema.ts`, `components/entities/legajos/LegajoTable.tsx`, `components/entities/informes/InformeForm.tsx`.
- `documentacion/procesos-del-negocio.md` § 5.

## Archivos a modificar

- Migración nueva `supabase/migrations/<timestamp>_legajo_reglas_estado.sql`.
- `lib/validations/legajos.schema.ts` (cierre solo `cerrado`).
- `hooks/legajos/useUpdateLegajo.ts` (cierre sin `fecha_cierre`, errores del trigger, `useArchivarLegajo`).
- `app/(dashboard)/legajos/[id]/page.tsx` (diálogo de cierre, botón Archivar, indicador).
- `components/entities/legajos/LegajoTable.tsx` (indicador).
- Componentes y hook de incidentes para cambiar el estado (a confirmar al implementar).

## Supuestos

1. Archivar es una acción manual de un usuario después de los 12 meses; no hay un job automático (el proyecto no tiene infraestructura de cron).
2. "En evaluación" no se modela: el sistema no tiene un Plan de Intervención Individual (PII) como entidad.
3. La firma dual para resolver incidentes queda fuera de alcance; alcanza con el registro en el `audit_log`.

## Criterios de aceptación

1. No se puede crear un legajo en `cerrado` ni en `archivado`.
2. Un legajo `activo` se cierra con motivo; sin motivo, la base lo rechaza.
3. `activo` → `archivado` y `cerrado` → `activo` se rechazan en la base.
4. Un legajo `cerrado` no acepta cambios de número, apertura ni observaciones.
5. Un legajo cerrado hace menos de 12 meses no se puede archivar; uno cerrado hace más, sí.
6. Un incidente se puede pasar a `en_seguimiento` y a `cerrado` (este último con acciones tomadas), y después su legajo se puede cerrar.
7. El indicador aparece con una alerta de incidente pendiente y se apaga al resolverla.

## Verificación

- Criterios 1 a 5 contra la base, con bloques que fuerzan `ROLLBACK` (o Supabase local).
- Criterios 6 y 7 en la app.
- `npm run lint` (archivos tocados), `npx tsc --noEmit`, `npm run build`.
- `get_advisors` de seguridad sin avisos nuevos.
- Después: cerrar `LEG-2023-015` desde la app (resolver su incidente, cargar el informe de egreso y cerrarlo con motivo). Es un paso del equipo, no de la migración.
