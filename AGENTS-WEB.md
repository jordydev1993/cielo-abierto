# AGENTS-WEB.md — Argüello Infancias (web)

Documento de trabajo del repo web (`cielo-abierto` en GitHub). Escrito bajo la metodología **Vibe Engineering + SDD** y basado exclusivamente en lo confirmado por inspección real del código, las migraciones (`supabase/migrations/`) y la base en vivo — no en documentación aspiracional.

> Historia: este archivo reemplaza al `AGENTS.md` que existió hasta el commit `fcf0791` y fue borrado por error en esa reestructuración. Los `prompts/002`–`013` lo citan como `AGENTS.md`; es este archivo. Mapa de secciones citadas al final.

`CLAUDE.md` carga este archivo (`@AGENTS-WEB.md`).

---

## Rol

Actuás como ingeniero de software principal de este proyecto. Seguís el ciclo de trabajo de la sección siguiente para cada funcionalidad nueva o modificada. **Regla fundamental: el líder (Jordy) toma las decisiones de producto/arquitectura/seguridad; vos hacés el trabajo técnico.** Ante una decisión de ese tipo, detenete, explicá el problema, presentá alternativas, recomendá una, y esperá la decisión. Para decisiones pequeñas y reversibles, usá criterio técnico.

## Flujo de trabajo

Para cada tarjeta del tablero (https://github.com/users/jordydev1993/projects/1):

1. Leer este `AGENTS-WEB.md`.
2. Leer las skills relevantes en `.claude/skills/` (ver sección Skills).
3. Inspeccionar el código relacionado — no asumir, confirmar en el repo.
4. Identificar dependencias y ambigüedades.
5. Si hay una decisión realmente necesaria, preguntar concretamente.
6. Escribir un plan en `prompts/NNN-nombre.md` (formato: Objetivo, Contexto, Archivos inspeccionados, Skills utilizadas, Supuestos, Archivos a crear/modificar, Requisitos, Seguridad, Criterios de aceptación, Chequeos, Verificación manual).
7. **No implementar todavía.** Informar que el plan está listo y esperar aprobación explícita ("✓ Aprobado" / "✕ Cambiar X").
8. Solo después de la aprobación, implementar.
9. Ejecutar los chequeos: `npm run lint` y `npm run build` (y `npx tsc --noEmit` si tocaste tipos).
10. Informar exactamente cómo probar la funcionalidad manualmente.

El proceso completo de equipo (rama → PR → merge → cerrar tarjeta) está en `GUIA-PROCESO-COMPLETO.md`.

Si aparece una contradicción entre esta documentación y el código actual: detectarla, documentarla en "Deuda conocida", **no corregirla automáticamente**, y plantear la decisión antes de implementar.

## Producto

Sistema web para centralizar y digitalizar la gestión de una residencia de NNyA (niños, niñas y adolescentes) bajo protección judicial, en Córdoba, Argentina. Reemplaza planillas Excel/Word y registros físicos fragmentados por un sistema trazable, con alertas sobre eventos críticos. El complemento móvil vive en el repo `arguello-infancias-mobile` y comparte la misma base de datos.

Actores: **Admin** (Dirección — acceso total, incluye usuarios/roles) y **Equipo Tecnico** (psicólogos, trabajadores sociales, abogados, educadores — CRUD completo sobre entidades de negocio, sin acceso a usuarios/roles). El rol se resuelve vía RPC `get_my_role`.

Documentos de negocio (fuera del repo, en la carpeta compartida del equipo): `presentacion-del-proyecto.md`, `procesos-del-negocio.md`.

## Alcance

Módulos de negocio implementados: NNyA, Tutores, Legajos, Intervenciones (tab dentro de Legajo), Turnos, Alertas, Actividades (módulo propio en el sidebar), Incidentes (con predicción de severidad), Diagnósticos, Medicamentos, Informes, Documentos, Audiencias Judiciales, más Usuarios y Roles (administración) y Dashboard con KPIs.

## Fuera de alcance

- Redes sociales, integraciones externas no justificadas, IA generativa "porque se puede", funcionalidades administrativas no pedidas, features "por si acaso".
- **Gestión de recursos/fondos, stock y asistencia de personal** (proceso 1.4 de `procesos-del-negocio.md`): proceso institucional real, sin entidades en el modelo de datos implementado. No construir sin decisión explícita.

## Arquitectura

Next.js 16 App Router con route groups `(auth)` y `(dashboard)`:

```
components/ui/            primitivas (shadcn/Radix): button, input, select, table, dialog, card, badge, form, tabs...
components/shared/        AccessGuard, ConfirmDialog, DataTable, KPICard
components/entities/<e>/  Form.tsx + List.tsx por entidad (patrón uniforme)
components/legajos/tabs/  sub-tabs del detalle de legajo (Resumen, Salud, Alertas, Documentos, Incidentes, Turnos, Intervenciones)
hooks/<entidad>/          un hook useQuery/useMutation por operación (TanStack Query)
lib/supabase/client.ts    cliente browser (createBrowserClient, solo NEXT_PUBLIC_*)
lib/supabase/server.ts    cliente server (createServerClient + cookies())
lib/validations/*.schema.ts  un schema zod por entidad
lib/constants/queryKeys.ts   factories de query keys
context/AuthContext.tsx   rol del usuario vía RPC get_my_role
proxy.ts                  protección de rutas (Next 16 renombró middleware.ts a proxy.ts)
app/api/                  incidentes/prediccion, usuarios
supabase/migrations/      migraciones SQL — fuente de verdad del schema (no solo el proyecto remoto)
types/database.types.ts   tipos de dominio escritos a mano (NO generados con `supabase gen types`)
```

Capas: UI (`components/ui` → `components/entities`) → datos (`hooks/*` con TanStack Query) → acceso a Supabase (`lib/supabase/{client,server}.ts`) → Postgres con RLS. Autorización por rol: `context/AuthContext.tsx` + `components/shared/AccessGuard.tsx` (cliente); RLS en la base (servidor/DB). **No hay una capa Express**: el cliente Supabase habla directo con la base, con RLS de guardia.

## Stack confirmado

Next 16.2.6, React 19.2.4, TypeScript strict, Tailwind 4 vía `@theme` en `app/globals.css` (sin `tailwind.config.*`), `@supabase/ssr` + `@supabase/supabase-js`, **TanStack Query** (no Table ni Router), react-hook-form + `@hookform/resolvers` + zod 4, Radix UI, `class-variance-authority`, recharts, date-fns, lucide-react. `playwright` está en devDependencies pero sin tests escritos.

No agregar dependencias nuevas sin justificar la necesidad primero.

## Prohibiciones

- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente (solo server-side, hoy en `app/api/usuarios/route.ts`).
- No usar `any` sin justificación explícita.
- No duplicar componentes existentes en `components/ui/` o `components/entities/`.
- No refactors ni "limpiezas" no relacionadas con la tarea pedida.
- No reemplazar tecnologías existentes sin razón técnica explícita.

## Modelo de datos

**27 tablas** en `public` (Postgres/Supabase), gestionadas vía `supabase/migrations/`. RLS activo en todas.

17 originales: `roles`, `usuarios`, `nnya`, `tutores`, `nnya_tutores`, `legajos`, `intervenciones`, `turnos`, `alertas`, `actividades`, `incidentes`, `diagnosticos`, `medicamentos`, `informes`, `documentos`, `audiencias_judiciales`, `audit_log`.

10 de FASE A1 (`prompts/012`, migración `20260827000033`) — **tablas + RLS creadas, sin UI todavía** (ver Roadmap): `referentes`, `vinculos_tutela`, `validaciones_renaper`, `transferencia_auh`, `evaluacion_institucional` (+ `_asistentes`, `_casos`), `propuestas_mejora`, `turnos_personal`, `seguimiento_post_egreso`.

Reglas de negocio completas (máquinas de estado, validaciones por entidad) en `procesos-del-negocio.md`.

**Ojo con migraciones superseded**: `supabase/migrations/20260620000031_clean_schema.sql` ("Reemplaza las migraciones 001-030 en una DB nueva") es la definición de schema **vigente** — puede diferir de migraciones individuales más viejas para la misma tabla (ej. `intervenciones.tipo` tenía un `CHECK` con 7 valores en la migración de mayo, pero `clean_schema.sql` lo redefine como texto libre; los datos semilla reales solo son válidos bajo `clean_schema.sql`). Antes de escribir un schema Zod contra una columna, verificar el `CREATE TABLE` en `clean_schema.sql` — o mejor, consultar los valores reales ya insertados con una query.

## Contratos de API

Dos route handlers en `app/api/`:
- `incidentes/prediccion` — predicción de severidad de incidente (usada desde el form de Incidentes).
- `usuarios` (POST) — creación de usuario admin, usa `SUPABASE_SERVICE_ROLE_KEY` server-side. Exige sesión + rol `Admin` (`prompts/002`).

## Seguridad

- RLS activo en las 27 tablas.
- Roles de aplicación: `Admin`, `Equipo Tecnico` (vía RPC `get_my_role`).
- Nunca loguear ni exponer datos sensibles de NNyA innecesariamente.
- Limitar el acceso a información sensible según rol desde el diseño de cada funcionalidad, no como añadido posterior.
- **Nota honesta**: la documentación vieja afirmaba cifrado AES-256 de DNI/nombres y un audit log inmutable "en cada acción". Ninguna de las dos cosas está implementada hoy (ver Deuda conocida #DNI y #audit). No repetir esas afirmaciones como si fueran ciertas.

## Estándares de código

- TypeScript strict, tipos explícitos.
- Un hook (`useQuery`/`useMutation`) por operación de datos, en `hooks/<entidad>/`.
- Un schema zod por entidad en `lib/validations/`.
- Patrón `components/entities/<entidad>/Form.tsx` + `List.tsx` — seguirlo para entidades nuevas.
- Componentes y funciones pequeños, responsabilidades separadas, sin abstracciones prematuras.

## Regla ante dudas

Si algo no está documentado en las fuentes de negocio o no se puede confirmar leyendo el código: no inventar. Preguntar o documentar el vacío explícitamente.

## Skills

Viven en `.claude/skills/` (convención nativa de Claude Code — no crear `.agents/skills/` paralela).

| Skill | Para qué sirve |
|---|---|
| `domain-validation` | Valida que los requisitos coincidan con los procesos reales de la residencia |
| `database-design` | Diseño e implementación del modelo relacional en Postgres/Supabase |
| `auth-implementation` | Autenticación y sesiones con Supabase Auth + Next.js 16 |
| `role-permission` | Roles y matriz de permisos del sistema |
| `crud-generator` | Patrón estándar para generar un ABM completo por entidad |
| `sprint-planning` | Seguimiento de sprints (histórico) |
| `documentation` | Mantenimiento de documentación del proyecto |
| `testing-nnya` | Checklist manual de QA por módulo |

**Nota de fiabilidad**: algunas skills (`crud-generator`, `sprint-planning`) contienen tablas de estado (`⏳`/`✅`) que no se mantuvieron actualizadas. Ante una discrepancia entre una skill y el código real, **el código es la fuente de verdad**; actualizar la skill si corresponde en vez de confiar en su tabla.

---

## Roadmap

Estado por fase (detalle en `docs/evolucion/CHECKLIST-FINAL (1).md`):

| Fase | Qué es | Estado |
|---|---|---|
| Core (12–16 módulos CRUD) | ABMs de las 17 entidades originales + auth + roles + dashboard | ✅ Implementado |
| A0 | `fecha_egreso` en `nnya` + backfill + CHECK (`prompts/011`) | ✅ Implementado (migración `20260826000032`) |
| A1 | Crear las 10 tablas de tutela/evaluación/turnos/seguimiento (`prompts/012`) | ✅ Tablas + RLS (migración `20260827000033`) |
| A2 | Políticas RLS por operación para esas 10 tablas + trigger de protección de `dni` en `referentes` (`prompts/013`) | ✅ Implementado (migración `20260827000034`) |
| B | UI de tutela/referentes + validación RENAPER + transferencia AUH | ⏳ Sin empezar — [issue #25] |
| C | UI de evaluación institucional + kanban de propuestas de mejora + notificaciones | ⏳ Sin empezar — [issue #26] |
| D | UI de `turnos_personal` + firma doble de traspaso de guardia + dashboard de cobertura | ⏳ Sin empezar — [issue #27] |
| E | UI de seguimiento post-egreso + cron 30/60 días + dashboard de reinserción | ⏳ Sin empezar — [issue #28] |

---

## Deuda conocida / gaps

Detectada por inspección directa del código. **No se corrige sin aprobación** (regla del flujo de trabajo). Cada ítem abierto es una tarjeta del tablero.

| # | Gap | Tarjeta |
|---|---|---|
| audit | El audit log NO está cableado: la base real tiene 0 triggers `trg_audit_*`, no existe `fn_audit_trigger()`, `audit_log` tiene 0 filas y sus columnas difieren de la migración. La doc dice "auditoría inmutable en cada acción" — falso. Requiere resolver la decisión A/B/C planteada en `prompts/012`. | issue #23 |
| rol-rot | `roles` tiene 7 filas (no 2). 6 de 7 seed users apuntan a roles legacy (`Trabajador Social`, `Médico/a`, etc.) y no tienen `auth_user_id`: si se les da login, `get_my_role()` los deja fuera de las 27 tablas. | issue #24 |
| types | `types/database.types.ts` se escribe a mano. Debería generarse con `supabase gen types`. | issue #29 |
| tests | `playwright` instalado, 0 tests. | issue #30 |
| design | `docs/design-system.md` §5: sin escala tipográfica nombrada; `Toaster` sin variantes warning/info; sin wrapper de alert-dialog no destructivo; colores hardcodeados en `NnyaTable.tsx`. | issue #31 |
| dni | `nnya.dni` y `tutores.dni` son `varchar` plano. `AGENTS`/arquitectura afirmaban AES-256; `pgcrypto` instalado sin usar. | issue #32 |
| readme | `README.md` del repo sigue siendo el boilerplate de `create-next-app`. | issue #33 |
| proceso-1.4 | Recursos/fondos, stock y asistencia de personal: proceso real sin modelo de datos. Fuera de alcance hasta decisión. | — |
| legajo-estados | La máquina de estados de `legajos` en `procesos-del-negocio.md` ("En incidente", "En evaluación") es más amplia que el `CHECK` real (`activo`/`cerrado`/`archivado`). Discrepancia documentada, no tocada. | — |

### Resuelto

Registro de gaps ya cerrados (ledger histórico; cada uno tiene su `prompts/NNN`):

- **`app/api/usuarios` sin chequeo de rol** — `prompts/002`. El endpoint exige sesión + rol `Admin` (`get_my_role`); `401` sin sesión, `403` si no es Admin. Verificado end-to-end.
- **Dashboard `/dashboard` con KPIs comentados** — `prompts/003`. Se descomentó el grid de `KPICard` (NNyA activos, Legajos activos, Alertas pendientes); la query ya era correcta.
- **`nnya/[id]` sin vista de detalle** — `prompts/004`. `nnya/[id]/page.tsx` de solo lectura + botón "Ver" (`Eye`) conectado en `NnyaTable`.
- **`legajos/[id]` sin ruta de edición** — `prompts/005`. `legajos/[id]/editar/page.tsx` + `useUpdateLegajoDatos` (allow-list, nunca toca `estado`). Verificado end-to-end.
- **Zod 4 `.uuid()` rechaza IDs semilla** — `prompts/006`. 7 schemas usaban `.uuid()` (RFC4122 estricto) contra IDs semilla con patrón no conforme → fallos de validación silenciosos. Reemplazado por regex de forma UUID.
- **Inconsistencia de tokens en primitivas UI** — `prompts/007`. `select`, `dialog`, `tabs`, `textarea`, `toaster`, `form.tsx` migrados de la paleta shadcn genérica a los tokens `@theme`.
- **`next dev` no hidrata en `127.0.0.1`** — `prompts/008`. Next 16 bloquea recursos `/_next/*` desde orígenes que no sean `localhost`. Se agregó `allowedDevOrigins: ['127.0.0.1']` a `next.config.ts` (solo dev).
- **Módulo "Intervenciones" inexistente** (pese a estar listado como "implementado") — `prompts/009`. Schema + hooks + `IntervencionForm/List` + tab en `legajos/[id]`. `tipo` quedó como texto libre (no enum) tras verificar `clean_schema.sql`.
- **Módulo "Actividades" inexistente** — `prompts/010`. Módulo propio en el sidebar (`/actividades`), grupal (`nnya_ids` array, sin `legajo_id`). `tipo` texto libre.
- **`nnya` sin `fecha_egreso`** — `prompts/011` (A0). Columna + backfill desde `legajos.fecha_cierre` + CHECK de coherencia. Migración `20260826000032`.
- **Sin soporte de datos para tutela / evaluación institucional / turnos de personal / seguimiento post-egreso** — `prompts/012` (A1). 10 tablas nuevas + RLS habilitado. Migración `20260827000033`. (La UI de estas tablas es FASES B–E, ver Roadmap.)
- **Las 10 tablas de A1 sin políticas RLS por operación** — `prompts/013` (A2). Políticas SELECT/INSERT/UPDATE/DELETE por rol + trigger que protege `referentes.dni`. Migración `20260827000034`.

---

## Mapa de secciones citadas por prompts anteriores

Los `prompts/002`–`013` fueron escritos cuando este archivo se llamaba `AGENTS.md` y usaban una numeración distinta. Equivalencias:

| Cita en los prompts | Sección de este archivo |
|---|---|
| `AGENTS.md § Deuda conocida` | Deuda conocida / gaps |
| `AGENTS.md § Resuelto` | Deuda conocida / gaps → Resuelto |
| `AGENTS.md sección 7` (seguridad / cifrado / auditoría) | Seguridad |
| `AGENTS.md sección 11` (FASE A/B/C/D/E) | Roadmap |
| `AGENTS.md sección 3` (diagrama de arquitectura) | Arquitectura |
