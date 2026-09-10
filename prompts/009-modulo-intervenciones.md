# 009 — Módulo Intervenciones (inexistente pese a estar documentado como implementado)

## Objetivo

Construir el módulo "Intervenciones" (acciones profesionales sobre el caso de un NNyA: Judicial, Social, Psicológica, Médica, Educativa, Familiar, Otra), que `AGENTS-WEB.md` listaba como uno de los "12 módulos de negocio ya implementados" pero que en realidad **no tiene ningún código de aplicación** — solo existe la tabla en la base de datos.

## Contexto

Verificado por inspección directa (no hay ambigüedad, es una ausencia total):
- `supabase/migrations/20260514000006_intervenciones.sql`: tabla `intervenciones` completa (`nnya_id`, `tipo`, `descripcion`, `fecha`, `profesional_id`, `estado` ∈ `pendiente|en_curso|cerrada`, `resultado`, `observaciones`).
- `supabase/migrations/20260514000017_rls_policies.sql`: RLS activo, policy `intervenciones_admin_tecnico_all` ya existe (mismo criterio que el resto: Admin y Equipo Tecnico con acceso total).
- `types/database.types.ts` líneas 83-96: el tipo `Intervencion` **ya existe**, escrito a mano junto con el resto, pero no lo usa ningún archivo.
- `grep` exhaustivo confirmó: no existe `components/entities/intervenciones/`, no existe `hooks/intervenciones/`, no existe `lib/validations/intervenciones.schema.ts`, no hay ninguna ruta ni tab que lo muestre. La única mención de "intervencion" en código de app es la palabra suelta "intervención" en un comentario de `useUpdateNnya`-adyacente, no el módulo.

`AGENTS-WEB.md` (sección Arquitectura, línea sobre "12 módulos de negocio ya implementados") tenía esta afirmación incorrecta — se corrige como parte de este plan, independientemente de la implementación.

`procesos-del-negocio.md` (sección "Intervención — 7 excepciones") documenta: asociación obligatoria a NNyA con legajo activo; fecha obligatoria y no futura; profesional responsable obligatorio; "Rol Educador" no gestiona intervenciones (simplificación ya conocida: el modelo de roles real solo tiene `Admin`/`Equipo Tecnico`, "Educador" es un cargo dentro de Equipo Tecnico, no un rol de app — mismo criterio que el resto de los módulos); eliminar requiere Admin (no se implementa un botón de eliminar en este plan — **ningún** tab de legajo lo tiene hoy — Incidentes, Turnos, Salud — así que no se introduce un patrón nuevo).

La tabla solo tiene `nnya_id` (no `legajo_id`) — mismo caso que `alertas`, que ya se muestra hoy como tab dentro del detalle de legajo resolviendo el `nnya_id` del legajo (`AlertasTab.tsx`, `useAlertasByNnya`). Se sigue ese mismo patrón, no el de Incidentes/Turnos (que sí tienen `legajo_id` propio).

## Archivos inspeccionados

- `supabase/migrations/20260514000006_intervenciones.sql`, `20260514000017_rls_policies.sql`, `20260620000031_clean_schema.sql` (confirmar RLS y schema vigentes)
- `types/database.types.ts` (tipo `Intervencion` ya escrito)
- `components/legajos/tabs/{IncidentesTab,AlertasTab}.tsx` (patrones de referencia: CRUD completo vs. solo lectura scoped a NNyA)
- `components/entities/incidentes/{IncidenteForm,IncidenteList}.tsx` (patrón de formulario+lista a replicar, simplificado — sin la parte de predicción de IA, que es específica de Incidentes)
- `hooks/incidentes/useCreateIncidente.ts`, `hooks/alertas/useAlertasByNnya.ts` (patrón de hooks: query "byNnya", mutation con verificación de regla de negocio)
- `hooks/usuarios/useUsuarios.ts` (ya existe y sirve para poblar el selector de "profesional responsable" — `profesional_id` es FK real a `usuarios`, no texto libre como en Incidentes/Turnos/Medicamentos)
- `lib/constants/queryKeys.ts` (convención de factories)
- `app/(dashboard)/legajos/[id]/page.tsx` (dónde se agrega la tab nueva)
- `../procesos-del-negocio.md` sección "Intervención (7 excepciones)"

## Skills utilizadas

`crud-generator` (patrón estándar de ABM por entidad) y `role-permission` (matriz de permisos: mismo criterio Admin/Equipo Tecnico que el resto) — solo como referencia de convención, no se sigue ninguna tabla de estado desactualizada de la skill (nota de fiabilidad de `AGENTS-WEB.md`).

## Supuestos

- `profesional_id` se completa con un `Select` poblado por `useUsuarios()` (ya existe), mostrando `apellido, nombre`. Es opcional a nivel de UI si el registro se hace como "Registrada" sin profesional aún designado, pero el schema lo marca obligatorio (`Requerido`) porque el CHECK real y la regla de negocio ("profesional responsable obligatorio") lo piden — sin excepción documentada para omitirlo.
- `fecha`: campo tipo `date` (no `datetime`, la columna es `DATE`), con regla "no futura" (mismo patrón `.refine()` que `diagnosticoSchema.fecha_diagnostico`).
- `resultado`: campo de texto libre, opcional a nivel de schema (no hay regla que lo exija al crear) — se completa típicamente al pasar la intervención a `cerrada`, pero este plan no agrega una transición de estado separada (como si tiene Legajo con "cerrar legajo"): se edita como cualquier campo del registro. Si el equipo quiere un flujo de "cerrar intervención" dedicado más adelante, es una decisión futura, no de este plan.
- Sin botón de eliminar (consistente con Incidentes/Turnos/Salud — ningún tab de legajo lo tiene hoy).
- La tab nueva se agrega en `legajos/[id]/page.tsx` entre "Incidentes" y "Alertas" (orden no tiene impacto funcional).

## Archivos a crear

- `lib/validations/intervenciones.schema.ts`
- `hooks/intervenciones/useIntervencionesByNnya.ts`
- `hooks/intervenciones/useCreateIntervencion.ts`
- `hooks/intervenciones/useUpdateIntervencion.ts` (editar `estado`/`resultado`/`observaciones` — mismo criterio que permitir corregir un registro ya cargado, como en Diagnósticos)
- `components/entities/intervenciones/IntervencionForm.tsx`
- `components/entities/intervenciones/IntervencionList.tsx`
- `components/legajos/tabs/IntervencionesTab.tsx`

## Archivos a modificar

- `lib/constants/queryKeys.ts`: agregar factory `intervenciones: { all, lists, byNnya }` (mismo patrón que `alertas`).
- `app/(dashboard)/legajos/[id]/page.tsx`: agregar tab "Intervenciones" (ícono `Briefcase` o similar de `lucide-react`) entre Incidentes y Alertas, con badge de cantidad (mismo patrón `TabBadge` ya usado); pasar `nnyaId` (ya disponible) y `legajoActivo` al nuevo `IntervencionesTab`.
- `AGENTS-WEB.md`: corregir la afirmación "12 módulos de negocio ya implementados" (ya no incluye Intervenciones en esa lista hasta que este plan se implemente; Actividades queda documentado aparte en Deuda conocida, fuera de alcance de este plan).

## Seguridad

- Mismo nivel de acceso que el resto: `AccessGuard roles={['Admin', 'Equipo Tecnico']}` para crear/editar (ya hay policy RLS `intervenciones_admin_tecnico_all`, no requiere cambios de RLS).
- No se expone ningún dato nuevo fuera del modelo de permisos ya vigente.

## Criterios de aceptación

- La tab "Intervenciones" aparece en `legajos/[id]` y lista las intervenciones del NNyA asociado (no del legajo — pueden existir intervenciones de un NNyA con legajo cerrado que se muestren igual, mismo criterio que Alertas).
- Botón "Registrar intervención" visible solo si `legajoActivo` y rol Admin/Equipo Tecnico (igual que Incidentes).
- Formulario valida: tipo (uno de los 7 del CHECK), descripción y profesional obligatorios, fecha obligatoria y no futura.
- El registro creado es editable (cambiar estado, agregar resultado/observaciones) desde la lista.
- `tsc --noEmit`, `npm run lint`, `npm run build` sin errores nuevos.

## Chequeos

- `npm run lint`
- `tsc --noEmit`
- `npm run build`

## Verificación manual

1. Ir a un legajo activo → tab "Intervenciones" → "Registrar intervención" → completar y guardar → confirmar que aparece en la lista.
2. Editar esa intervención (cambiar estado a `en_curso`, agregar resultado) → confirmar que persiste tras recargar.
3. Confirmar que un legajo no activo no muestra el botón de registrar (misma UI que Incidentes/Turnos/Salud/Documentos).
4. Confirmar que el selector de "Profesional responsable" lista usuarios reales (`useUsuarios()`).

---

**Estado**: implementado y verificado end-to-end. **Ajuste post-aprobación**: `tipo` se implementó como texto libre (`Input` + `datalist` de sugerencias), no como el `enum` de 7 valores capitalizados descrito arriba — la migración de la que salió ese enum (`20260514000006_intervenciones.sql`) resultó estar superseded por `20260620000031_clean_schema.sql`, que define `tipo` sin `CHECK`. Ver detalle en `AGENTS-WEB.md` § Resuelto. También se agregó `usuarios?: Pick<Usuario, 'id'|'nombre'|'apellido'>` a la interfaz `Intervencion` en `types/database.types.ts` (no listado originalmente en "Archivos a modificar"), necesario para el join usado en `useIntervencionesByNnya`.
