# 010 — Módulo Actividades (inexistente pese a estar documentado como implementado)

## Objetivo

Construir el módulo "Actividades" (talleres, salidas y eventos grupales o individuales: recreativos, educativos, terapéuticos), último gap de `AGENTS.md` § Deuda conocida. A diferencia de Intervenciones (009), no vive dentro del detalle de un legajo — es un módulo propio en el sidebar, como Turnos.

## Contexto

Tabla `actividades` completa en `supabase/migrations/20260620000031_clean_schema.sql` (la migración vigente, no la de mayo — lección de 009):

```sql
CREATE TABLE actividades (
  id, titulo VARCHAR(200) NOT NULL, descripcion TEXT, tipo VARCHAR(50) NOT NULL,
  fecha DATE NOT NULL, hora_inicio TIME, hora_fin TIME, lugar VARCHAR(200),
  responsable_id UUID REFERENCES usuarios(id), nnya_ids UUID[] NOT NULL DEFAULT '{}',
  estado VARCHAR(20) NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada','en_curso','realizada','cancelada')),
  observaciones TEXT, created_by, created_at, updated_at
)
```
RLS: policy `actividades_admin_tecnico_all` ya existe (mismo criterio Admin/Equipo Tecnico de siempre).

**Confirmado con los 4 registros semilla reales** (consultados directo en la base): `tipo` es texto libre minúsculo (`'recreativa'`, `'educativa'`, `'terapeutica'`) — **sin `CHECK`**, igual que se corrigió en 009 para Intervenciones. `nnya_ids` es un array de 2 a 4 NNyA por actividad (no una relación 1 a 1) — confirma que es una actividad **grupal**, no ligada a un legajo puntual. **No existe columna `legajo_id`** en la tabla.

`procesos-del-negocio.md` § "Actividad (6 excepciones)" dice "asociación a legajo obligatoria" y "no se pueden registrar actividades con fecha futura" — **ambas afirmaciones contradicen el schema real y los datos semilla** (no hay `legajo_id`; los 4 registros semilla tienen `estado: 'programada'` con fechas que representan justamente una actividad agendada para más adelante). Se sigue el criterio ya establecido en `AGENTS.md`: el código/modelo de datos real es la fuente de verdad ante una discrepancia — no se agrega una validación de "fecha no futura" ni un campo `legajo_id` inexistente.

## Archivos inspeccionados

- `supabase/migrations/20260620000031_clean_schema.sql` (tabla y RLS vigentes)
- 4 filas reales de `actividades` (consulta directa a la base, vía `service_role`)
- `app/(dashboard)/turnos/page.tsx`, `hooks/turnos/{useTurnos,useActualizarTurno}.ts` (patrón de referencia: módulo propio de nivel superior, sin ruta anidada en legajo, con filtros y acciones de cambio de estado — el más parecido a lo que necesita Actividades)
- `hooks/nnya/useNnyas.ts` (ya existe, sirve para poblar el selector múltiple de NNyA)
- `hooks/usuarios/useUsuarios.ts` (ya existe, reutilizado en 009 para "responsable")
- `app/(dashboard)/layout.tsx` (dónde se agrega la entrada de sidebar)
- `docs/pantallas stitch/gesti_n_de_actividades_diarias_listado/`, `registrar_nueva_actividad/` (referencia visual opcional, no vinculante — mismo criterio que el resto del proyecto con Stitch)
- `../procesos-del-negocio.md` § "Actividad (6 excepciones)" (contrastado contra el schema real, discrepancias documentadas arriba)

## Skills utilizadas

`crud-generator` como referencia de convención (no de su tabla de estado desactualizada, por la nota de fiabilidad de `AGENTS.md`).

## Supuestos

- **Sin campo `legajo_id`**: se filtra/relaciona únicamente por NNyA (`nnya_ids`), como dicta el schema real.
- **Selector múltiple de NNyA**: no existe un componente multi-select en `components/ui/` — se construye una lista de checkboxes simple dentro de `ActividadForm` (sin agregar una librería nueva ni inventar un componente genérico reutilizable no pedido — si se necesita en más lugares, se extrae después).
- **Resolución de nombres de NNyA**: como `nnya_ids` es un array de UUIDs (no una FK/join real), se resuelven los nombres cruzando client-side contra `useNnyas()` (ya se cachea con `staleTime` de 5 min) — no se modifica el modelo de datos para agregar una relación.
- **`tipo`**: texto libre (`Input` + `datalist` de sugerencias: Recreativa, Educativa, Terapéutica, Social, Otra) — mismo criterio corregido en 009, dado que no hay `CHECK` en la columna.
- **Estados**: se sigue el enum real (`programada`, `en_curso`, `realizada`, `cancelada`). Acciones de cambio de estado en la lista (marcar en curso / realizada / cancelada), sin editar el resto de los campos — mismo patrón que `TurnosPage`'s "Realizado"/"Cancelar", no un formulario de edición completo.
- **Sin fecha futura bloqueada**: al contrario que Turnos, no se valida "fecha no futura" — es el comportamiento esperado (agendar con anticipación), consistente con los datos reales.
- La regla "Rol Educador no puede eliminar..." no se implementa — mismo criterio que en 009: el modelo de roles real no distingue "Educador" de Equipo Tecnico.

## Archivos a crear

- `lib/validations/actividades.schema.ts`
- `hooks/actividades/useActividades.ts` (lista completa, con `usuarios:responsable_id` embebido)
- `hooks/actividades/useCreateActividad.ts`
- `hooks/actividades/useActualizarEstadoActividad.ts` (cambiar `estado`, mismo criterio que `useActualizarTurno`)
- `components/entities/actividades/ActividadForm.tsx` (título, descripción, tipo, fecha, hora inicio/fin, lugar, responsable, checkboxes de NNyA, observaciones)
- `components/entities/actividades/ActividadList.tsx`
- `app/(dashboard)/actividades/page.tsx` (lista + botón "Nueva actividad" que abre el form en un `Dialog`, filtros por estado similares a `TurnosPage`)

## Archivos a modificar

- `lib/constants/queryKeys.ts`: agregar factory `actividades: { all, lists }`.
- `app/(dashboard)/layout.tsx`: agregar `{ href: '/actividades', label: 'Actividades', icon: PartyPopper }` (o ícono similar de `lucide-react`) a `NAV_ADMIN_TECNICO`, junto a Incidentes/Alertas/Turnos/Informes.
- `types/database.types.ts`: agregar interfaz `Actividad` (no existe todavía, a diferencia de `Intervencion` que ya estaba escrita).
- `AGENTS.md`: mover Actividades de "Deuda conocida" a "Resuelto"; actualizar el listado de módulos implementados en "Alcance".

## Seguridad

Mismo nivel de acceso que el resto: `AccessGuard roles={['Admin', 'Equipo Tecnico']}` para crear/cambiar estado (RLS `actividades_admin_tecnico_all` ya cubre el acceso a nivel de fila, sin cambios necesarios).

## Criterios de aceptación

- `/actividades` aparece en el sidebar y lista todas las actividades con título, tipo, fecha/horario, lugar, responsable y NNyA involucrados (nombres resueltos).
- "Nueva actividad" permite seleccionar 1 o más NNyA (checkboxes), completa los campos obligatorios (título, tipo, fecha) y guarda.
- Cambiar estado (programada → en_curso → realizada, o cancelada) funciona desde la lista, sin abrir un formulario completo.
- `tsc --noEmit`, `npm run lint`, `npm run build` sin errores nuevos.

## Chequeos

- `npm run lint`
- `tsc --noEmit`
- `npm run build`

## Verificación manual

1. Ir a `/actividades` → confirmar que se ven las 4 actividades semilla con los NNyA correctos resueltos por nombre.
2. "Nueva actividad" → seleccionar 2 NNyA, completar título/tipo/fecha → guardar → confirmar que aparece en la lista con los NNyA correctos.
3. Cambiar el estado de una actividad de prueba (programada → en_curso → realizada) → confirmar que persiste tras recargar.
4. Confirmar que el nuevo ítem de sidebar "Actividades" no aparece para un usuario sin rol Admin/Equipo Tecnico (no debería poder haber otro rol hoy, pero el `AccessGuard`/RLS deben seguir aplicando igual que el resto).

---

**Estado**: implementado y verificado end-to-end en el navegador (crear actividad con 2 NNyA seleccionados, cambio de estado programada → en_curso, nav del sidebar). Dato de prueba limpiado de la base tras verificar.
