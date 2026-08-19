# AGENTS.md — Cielo Abierto

Este documento reemplaza al stub genérico anterior. Está escrito bajo la metodología **Vibe Engineering** definida en `../Prompt.md` (raíz del repo de tesis), y basado exclusivamente en lo confirmado por inspección real del código y las fuentes de negocio (`../presentacion-del-proyecto.md`, `../procesos-del-negocio.md`).

## Rol

Actuás como ingeniero de software principal de este proyecto. Seguís el ciclo de trabajo de la sección siguiente para cada funcionalidad nueva o modificada. **Regla fundamental: yo tomo las decisiones de producto/arquitectura/seguridad; vos hacés el trabajo técnico.** Ante una decisión de ese tipo, detenete, explicá el problema, presentá alternativas, recomendá una, y esperá mi decisión. Para decisiones pequeñas y reversibles, usá criterio técnico.

## Flujo de trabajo

Para cada funcionalidad nueva:

1. Leer este `AGENTS.md`.
2. Leer las skills relevantes en `.claude/skills/` (ver sección Skills).
3. Inspeccionar el código relacionado — no asumir, confirmar en el repo.
4. Identificar dependencias y ambigüedades.
5. Si hay una decisión realmente necesaria, preguntar concretamente.
6. Escribir un plan en `prompts/NNN-nombre.md` (formato: Objetivo, Contexto, Archivos inspeccionados, Skills utilizadas, Supuestos, Archivos a crear/modificar, Requisitos, Seguridad, Criterios de aceptación, Chequeos, Verificación manual).
7. **No implementar todavía.** Informar que el plan está listo y esperar aprobación explícita ("Aprobado" / "Ejecuta").
8. Solo después de la aprobación, implementar.
9. Ejecutar los chequeos correspondientes (`npm run lint`, `tsc --noEmit`, `npm run build` según aplique).
10. Informar exactamente cómo probar la funcionalidad manualmente.

Si aparece una contradicción entre esta documentación y el código actual: detectarla, documentarla, **no corregirla automáticamente**, y plantear la decisión antes de implementar.

## Producto

Sistema web para centralizar y digitalizar la gestión de una residencia de NNyA (niños, niñas y adolescentes) llamada "Cielo Abierto" (Córdoba, Argentina). Reemplaza planillas Excel/Word y registros físicos fragmentados por un sistema trazable, con alertas sobre eventos críticos. Detalle completo en `../presentacion-del-proyecto.md` y `../procesos-del-negocio.md`.

Actores: **Admin** (Dirección — acceso total incluyendo usuarios/roles) y **Equipo Tecnico** (psicólogos, trabajadores sociales, abogados, educadores — CRUD completo sobre entidades de negocio, sin acceso a usuarios/roles).

## Alcance

Módulos de negocio implementados: NNyA, Tutores, Legajos, Intervenciones (tab dentro de Legajo), Turnos, Alertas, Actividades (módulo propio en el sidebar), Incidentes, Diagnósticos, Medicamentos, Informes, Documentos, Audiencias Judiciales, más Usuarios y Roles (administración).

## Fuera de alcance

- Redes sociales, integraciones externas no justificadas, IA generativa "porque se puede", funcionalidades administrativas no pedidas, features "por si acaso" (`../Prompt.md` sección 16).
- **Gestión de recursos/fondos, stock y asistencia de personal** (proceso 1.4 de `../procesos-del-negocio.md`): documentado como proceso institucional real, pero sin entidades correspondientes en el modelo de datos implementado. No construir sin decisión explícita.

## Arquitectura

Next.js 16 App Router con route groups `(auth)` y `(dashboard)`:

```
components/ui/            primitivas (shadcn/Radix): button, input, select, table, dialog, card, badge, form, tabs...
components/shared/        AccessGuard, ConfirmDialog, DataTable, KPICard
components/entities/<e>/  Form.tsx + List.tsx por entidad (12 entidades, patrón uniforme)
components/legajos/tabs/  sub-tabs del detalle de legajo (Resumen, Salud, Alertas, Documentos, Incidentes, Turnos)
hooks/<entidad>/          un hook useQuery/useMutation por operación (TanStack Query), ~45 archivos
lib/supabase/client.ts    cliente browser (createBrowserClient, solo NEXT_PUBLIC_*)
lib/supabase/server.ts    cliente server (createServerClient + cookies())
lib/validations/*.schema.ts  un schema zod por entidad
lib/constants/queryKeys.ts   factories de query keys
context/AuthContext.tsx   rol del usuario vía RPC get_my_role
proxy.ts                  protección de rutas (Next 16 renombró middleware.ts a proxy.ts)
supabase/migrations/      31 migraciones SQL — fuente de verdad del schema (no solo el proyecto remoto)
types/database.types.ts   tipos de dominio escritos a mano (NO generados con `supabase gen types`)
```

Capas: UI (`components/ui` → `components/entities`) → datos (`hooks/*` con TanStack Query) → acceso a Supabase (`lib/supabase/{client,server}.ts`) → Postgres con RLS. Autorización por rol: `context/AuthContext.tsx` + `components/shared/AccessGuard.tsx` (cliente); RLS en la base (servidor/DB).

## Stack confirmado

Next 16.2.6, React 19.2.4, TypeScript strict (`tsconfig.json`), Tailwind 4 vía `@theme` en `app/globals.css` (sin `tailwind.config.*`), `@supabase/ssr` + `@supabase/supabase-js`, **TanStack Query** (no Table ni Router — el `Prompt.md` original dice "TanStack" genérico, en la práctica solo se usa Query), react-hook-form + `@hookform/resolvers` + zod 4, Radix UI, `class-variance-authority`, recharts, date-fns, lucide-react. `playwright` está en devDependencies pero sin tests escritos.

No agregues dependencias nuevas sin justificar la necesidad primero.

## Prohibiciones

- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente (solo se usa server-side hoy, en `app/api/usuarios/route.ts`).
- No usar `any` sin justificación explícita.
- No duplicar componentes existentes en `components/ui/` o `components/entities/`.
- No refactors ni "limpiezas" no relacionadas con la tarea pedida.
- No reemplazar tecnologías existentes sin razón técnica explícita.

## Modelo de datos

17 tablas en `public` (Postgres/Supabase), gestionadas vía `supabase/migrations/`: `roles`, `usuarios`, `nnya`, `tutores`, `nnya_tutores`, `legajos`, `intervenciones`, `turnos`, `alertas`, `actividades`, `incidentes`, `diagnosticos`, `medicamentos`, `informes`, `documentos`, `audiencias_judiciales`, `audit_log`. RLS activo en todas. Reglas de negocio completas (máquinas de estado, validaciones por entidad) en `../procesos-del-negocio.md` secciones 5 y 6 — usar esa referencia antes de tocar constraints o lógica de validación.

**Ojo con migraciones superseded**: `supabase/migrations/20260620000031_clean_schema.sql` ("Reemplaza las migraciones 001-030 en una DB nueva") es la definición de schema **vigente** — puede diferir de migraciones individuales más viejas para la misma tabla (ej. `intervenciones.tipo` tenía un `CHECK` con 7 valores capitalizados en la migración de mayo, pero `clean_schema.sql` lo redefine como `VARCHAR(50)` libre, sin `CHECK` — los datos semilla reales usan minúsculas/acentos que solo son válidos bajo la versión de `clean_schema.sql`). Antes de escribir un schema Zod contra una columna, verificar el `CREATE TABLE` en `clean_schema.sql` primero, no la migración incremental más vieja — o mejor, consultar los valores reales ya insertados con una query.

## Contratos de API

Dos route handlers en `app/api/`:
- `incidentes/prediccion` — predicción de severidad de incidente.
- `usuarios` (POST) — creación de usuario admin, usa `SUPABASE_SERVICE_ROLE_KEY` server-side. **Ver Deuda conocida**: sin chequeo de rol visible en el propio handler.

## Seguridad

- RLS activo en las 17 tablas.
- Roles de aplicación: `Admin`, `Equipo Tecnico` (vía RPC `get_my_role`).
- Nunca loguear ni exponer datos sensibles de NNyA innecesariamente.
- Limitar el acceso a información sensible según rol, desde el diseño de cada funcionalidad — no como añadido posterior.

## Estándares de código

- TypeScript strict, tipos explícitos.
- Un hook (`useQuery`/`useMutation`) por operación de datos, en `hooks/<entidad>/`.
- Un schema zod por entidad en `lib/validations/`.
- Patrón `components/entities/<entidad>/Form.tsx` + `List.tsx` (o `Table.tsx`) — seguirlo para entidades nuevas, no inventar uno distinto.
- Componentes y funciones pequeños, responsabilidades separadas, sin abstracciones prematuras.

## Regla ante dudas

Si algo no está documentado en `../presentacion-del-proyecto.md`, `../procesos-del-negocio.md` o no se puede confirmar leyendo el código: no inventar. Preguntar o documentar el vacío explícitamente.

## Skills

Las skills viven en `.claude/skills/` (convención nativa de Claude Code — **no crear una carpeta `.agents/skills/` paralela**, decisión tomada explícitamente para no fragmentar el conocimiento).

| Skill | Para qué sirve |
|---|---|
| `domain-validation` | Valida que los requisitos funcionales coincidan con los procesos reales de la residencia |
| `database-design` | Diseño e implementación del modelo relacional en Postgres/Supabase |
| `auth-implementation` | Autenticación y sesiones con Supabase Auth + Next.js 16 |
| `role-permission` | Roles y matriz de permisos del sistema |
| `crud-generator` | Patrón estándar para generar un ABM completo por entidad |
| `sprint-planning` | Seguimiento de sprints del proyecto (histórico) |
| `documentation` | Mantenimiento de documentación del proyecto |
| `testing-nnya` | Checklist manual de QA por módulo (NNyA, Legajo, Salud, Seguridad/RLS, Archivos) |

**Nota de fiabilidad**: algunas skills (ej. `crud-generator`, `sprint-planning`) contienen tablas de estado (`⏳`/`✅`) que no se actualizaron a medida que se implementaba el código — hoy los 12 módulos de negocio ya están construidos. Ante una discrepancia entre una skill y el código real, **el código es la fuente de verdad**; actualizar la skill si corresponde en vez de confiar en su tabla de estado.

Cuando una funcionalidad necesite una skill que no exista: identificar la necesidad, informarla, y crear/proponer la skill solo si corresponde — sin duplicar en este archivo documentación específica de una herramienta.

## Deuda conocida / gaps

Ninguno abierto por el momento. Detectados por inspección directa del código, documentados aquí sin corregir hasta tener aprobación (regla de la sección "Flujo de trabajo": detectar, documentar, no tocar sin aprobación) — ver sección "Resuelto" para el registro de lo ya cerrado.

### Resuelto

- ~~`app/api/usuarios/route.ts` sin chequeo de rol visible~~ — **corregido** (`prompts/002-proteger-endpoint-usuarios.md`, aprobado e implementado). El endpoint ahora exige sesión autenticada y rol `Admin` (vía `supabase.rpc('get_my_role')`) antes de crear un usuario; devuelve `401` sin sesión y `403` si el rol no es `Admin`. Verificado end-to-end: sin sesión → 307 a `/login` (bloqueado antes por `proxy.ts`), sesión `Equipo Tecnico` → 403, sesión `Admin` → 201 sin cambios de comportamiento.
- ~~Dashboard `/dashboard` con KPIs comentados~~ — **corregido** (`prompts/003-dashboard-kpis.md`, aprobado e implementado). Se descomentó el grid de `KPICard` (NNyA activos, Legajos activos, Alertas pendientes); la consulta de `useDashboardStats` ya era correcta contra el schema real, no requirió cambios. `tsc`/`lint` limpios y `/dashboard` compila y responde `200`.
- ~~`nnya/[id]` sin vista de detalle~~ — **corregido** (`prompts/004-nnya-detalle.md`, aprobado e implementado). Se creó `nnya/[id]/page.tsx` (solo lectura: datos personales, legajo asociado con link a `/legajos/[id]`, tutores) y se conectó el botón "Ver" (ícono `Eye`) en `NnyaTable.tsx`, que ya recibía el prop `onView` pero nunca lo usaba. `tsc`/`lint` limpios.
- ~~`legajos/[id]` sin ruta de edición~~ — **corregido** (`prompts/005-legajos-editar.md`, aprobado e implementado). Se creó `legajos/[id]/editar/page.tsx` (edita `numero_legajo`, `fecha_apertura`, `observaciones`; el NNyA asociado queda fijo), `useUpdateLegajoDatos` (allow-list explícito, nunca toca `estado`/`fecha_cierre`/`motivo_cierre`), botón "Editar" en `legajos/[id]/page.tsx` y ruteo condicional del ícono de la lista (`Pencil` → `/editar` solo si `estado === 'activo'`, si no `Eye` → detalle de solo lectura, sin cambios). Verificado end-to-end en el navegador (login real, guardar cambios, persistencia confirmada tras recargar, estado bloqueado para legajo `cerrado`).
- ~~Validación `.uuid()` de Zod 4 rechaza los IDs de datos semilla~~ — **corregido** (`prompts/006-fix-validacion-uuid-zod4.md`, aprobado e implementado). Descubierto verificando 005: Zod 4 (`zod@4.4.3`) exige formato RFC4122 estricto en `.uuid()`, pero los IDs semilla de `nnya`/`legajos` (patrón `X0000000-0000-0000-0000-00000000000Y`) no lo cumplen, causando fallos de validación silenciosos (sin error visible cuando el campo no se renderiza, como `nnya_id` oculto en la edición de legajo). Afectaba a **7 schemas**: `audiencias`, `diagnosticos`, `incidentes`, `informes`, `legajos`, `medicamentos`, `turnos` (todos los que validan `legajo_id`/`nnya_id`/`diagnostico_id` con `.uuid()`). Se reemplazó por `z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, ...)` (valida forma de UUID sin exigir versión/variante RFC4122) en los 7 archivos. `usuarios.schema.ts`/`roles.schema.ts` no afectados (roles usa UUIDs reales). `tsc`/`lint`/`build` limpios; verificado end-to-end guardando un legajo real.
- ~~Inconsistencia de tokens en primitivas de UI~~ — **corregido** (`prompts/007-tokens-ui.md`, aprobado e implementado). `select`, `dialog`, `tabs`, `textarea`, `toaster` y `form.tsx` (`components/ui/`) migrados de la paleta neutra genérica de shadcn (`slate-*`, `white`, `red-*`, `green-*`) a los tokens `@theme` del proyecto, siguiendo la convención ya usada en `input`/`card`/`button`/`badge` (ver tabla de mapeo en el prompt). Solo cambios de color — sin alterar layout, tamaño ni comportamiento. De paso se quitaron `ring-offset-background`/`ring-ring` en `tabs.tsx`, restos de shadcn que referenciaban tokens inexistentes en este proyecto (sin efecto real). `tsc`/`lint`/`build` limpios; verificado visualmente en el navegador (`Select` de `legajos/nuevo`, diálogo "Cerrar legajo" y `Tabs` del detalle de legajo).
- ~~`next dev` no hidrata la app en `127.0.0.1`~~ — **corregido** (`prompts/008-fix-next-dev-hidratacion.md`, implementado). Causa raíz: Next.js 16 bloquea por defecto, en modo desarrollo, las peticiones a recursos internos (`/_next/*`, incluido el bootstrap de hidratación) que no vengan del origen exacto que el dev server considera "local" (`localhost`, no `127.0.0.1` — son orígenes distintos para el navegador aunque apunten al mismo loopback). Visible en el propio log de `next dev`: `⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "127.0.0.1"`. El bloqueo es silencioso del lado del cliente (no lanza excepción capturable), lo que llevó a una investigación larga (reinstalación de dependencias, cambio de bundler) antes de encontrar la causa real en el log del servidor. Se agregó `allowedDevOrigins: ['127.0.0.1']` a `next.config.ts` — no afecta producción (`next build`/`next start`), es una opción exclusiva de `next dev`. Verificado end-to-end: hidratación confirmada, navegación SPA sin recarga, warning desaparecido del log.
- ~~Módulo "Intervenciones" inexistente~~ — **corregido** (`prompts/009-modulo-intervenciones.md`, aprobado e implementado). Se creó `lib/validations/intervenciones.schema.ts`, `hooks/intervenciones/{useIntervencionesByNnya,useCreateIntervencion,useUpdateIntervencion}.ts`, `components/entities/intervenciones/{IntervencionForm,IntervencionList}.tsx` y `components/legajos/tabs/IntervencionesTab.tsx` (nueva tab en `legajos/[id]`), reutilizando `useUsuarios()` ya existente para el selector de profesional responsable. **Corrección durante la verificación**: el plan original definió `tipo` como `enum` de 7 valores capitalizados basándose en la migración `20260514000006_intervenciones.sql` — pero esa migración fue reemplazada por `20260620000031_clean_schema.sql`, que define `tipo` como texto libre sin `CHECK`. Los datos semilla reales (`'social'`, `'psicológica'`, `'médica'`, `'legal'`, minúsculas/acentos) lo confirmaron: el enum los habría rechazado silenciosamente. Se corrigió a `z.string().min(1).max(50)` con un `<Input>` + `<datalist>` de sugerencias en vez de un `<Select>` cerrado. Ver nota nueva en "Modelo de datos" sobre migraciones superseded. Sin botón de eliminar (consistente con Incidentes/Turnos/Salud). `tsc`/`lint`/`build` limpios; verificado end-to-end en el navegador (crear, editar un registro nuevo y uno semilla real, badge de conteo en la tab).
- ~~Módulo "Actividades" inexistente~~ — **corregido** (`prompts/010-modulo-actividades.md`, aprobado e implementado). A diferencia de Intervenciones, es un módulo propio en el sidebar (`/actividades`, ícono `PartyPopper`), no una tab de legajo — la tabla real no tiene `legajo_id`, solo `nnya_ids` (array, actividad grupal). Se creó `lib/validations/actividades.schema.ts`, `hooks/actividades/{useActividades,useCreateActividad,useActualizarEstadoActividad}.ts`, `components/entities/actividades/{ActividadForm,ActividadList}.tsx`, `app/(dashboard)/actividades/page.tsx` y la interfaz `Actividad` en `types/database.types.ts`. Selector múltiple de NNyA por checkboxes (no existe multi-select en `components/ui/`, no se agregó uno genérico). `tipo` es texto libre desde el inicio (aplicando la lección de 009, verificado contra los 4 registros semilla reales: `'recreativa'`, `'educativa'`, `'terapeutica'`). Se detectó y se ignoró deliberadamente una discrepancia entre `procesos-del-negocio.md` (que pide `legajo_id` obligatorio y prohíbe fecha futura) y el schema/datos reales (sin esa columna; `estado: 'programada'` con fechas futuras es el uso esperado) — se siguió el código como fuente de verdad. Patrón de referencia: `TurnosPage` (módulo standalone con acciones de cambio de estado en la lista, sin edición completa). `tsc`/`lint`/`build` limpios; verificado end-to-end en el navegador (crear con 2 NNyA, cambiar estado programada→en_curso, nav del sidebar).
