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
types/database.generated.ts  generado con `supabase gen types` — no editar a mano (ver prompts/020)
types/database.types.ts   tipos de dominio derivados de database.generated.ts, angostando los `CHECK` a sus uniones literales
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

**28 tablas** en `public` (Postgres/Supabase), gestionadas vía `supabase/migrations/`. RLS activo en todas.

17 originales: `roles`, `usuarios`, `nnya`, `tutores`, `nnya_tutores`, `legajos`, `intervenciones`, `turnos`, `alertas`, `actividades`, `incidentes`, `diagnosticos`, `medicamentos`, `informes`, `documentos`, `audiencias_judiciales`, `audit_log`.

10 de FASE A1 (`prompts/012`, migración `20260827000033`) — **tablas + RLS creadas, sin UI todavía** (ver Roadmap): `referentes`, `vinculos_tutela`, `validaciones_renaper`, `transferencia_auh`, `evaluacion_institucional` (+ `_asistentes`, `_casos`), `propuestas_mejora`, `turnos_personal`, `seguimiento_post_egreso`.

1 de mobile (`prompts/015`, migración `20260912000036`): `novedades` — diario liviano de novedades por NNA (F2/F3 mobile), consumida solo por la app mobile, sin UI en la web.

Reglas de negocio completas (máquinas de estado, validaciones por entidad) en `procesos-del-negocio.md`.

**Ojo con migraciones superseded**: `supabase/migrations/20260620000031_clean_schema.sql` ("Reemplaza las migraciones 001-030 en una DB nueva") es la definición de schema **vigente** — puede diferir de migraciones individuales más viejas para la misma tabla (ej. `intervenciones.tipo` tenía un `CHECK` con 7 valores en la migración de mayo, pero `clean_schema.sql` lo redefine como texto libre; los datos semilla reales solo son válidos bajo `clean_schema.sql`). Antes de escribir un schema Zod contra una columna, verificar el `CREATE TABLE` en `clean_schema.sql` — o mejor, consultar los valores reales ya insertados con una query.

## Contratos de API

Dos route handlers en `app/api/`:
- `incidentes/prediccion` — predicción de severidad de incidente (usada desde el form de Incidentes).
- `usuarios` (POST) — creación de usuario admin, usa `SUPABASE_SERVICE_ROLE_KEY` server-side. Exige sesión + rol `Admin` (`prompts/002`).

## Seguridad

- RLS activo en las 28 tablas.
- Roles de aplicación: `Admin`, `Equipo Tecnico` (vía RPC `get_my_role`).
- Nunca loguear ni exponer datos sensibles de NNyA innecesariamente.
- Limitar el acceso a información sensible según rol desde el diseño de cada funcionalidad, no como añadido posterior.
- **Audit log**: implementado (`prompts/018`). `fn_audit_trigger()` + `trg_audit_*` en las 27 tablas de negocio (todas menos `audit_log` misma) registran cada INSERT/UPDATE/DELETE. Solo `Admin` puede leerlo (`audit_log_admin_read`); nadie puede editarlo ni borrarlo (sin política de UPDATE/DELETE → RLS lo deniega), por eso es inmutable en la práctica.
- **DNI en texto plano — decisión tomada (issue #11, `prompts/021`)**: `nnya.dni`, `tutores.dni` y `referentes.dni` son `varchar` plano, `pgcrypto` está instalado pero sin usar. La documentación vieja afirmaba cifrado AES-256; Jordy decidió no implementarlo (cifrar rompería el `UNIQUE(dni)` y la búsqueda parcial sin agregar una columna de hash aparte, y la clave viviría igual dentro de Postgres) y en cambio corregir la documentación que lo afirmaba falsamente. No repetir la afirmación de cifrado como si fuera cierta.

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
| B | UI de tutela/referentes + validación RENAPER + transferencia AUH | ✅ Implementado (`prompts/019`) |
| C | UI de evaluación institucional + kanban de propuestas de mejora + notificaciones | ✅ Implementado (`prompts/022`) |
| D | UI de `turnos_personal` + firma doble de traspaso de guardia + dashboard de cobertura | ✅ Implementado (`prompts/023`) |
| E | UI de seguimiento post-egreso + cron 30/60 días + dashboard de reinserción | ✅ Implementado (`prompts/026`) |

---

## Deuda conocida / gaps

Detectada por inspección directa del código. **No se corrige sin aprobación** (regla del flujo de trabajo). Cada ítem abierto es una tarjeta del tablero.

| # | Gap | Tarjeta |
|---|---|---|
| tests | `playwright` instalado, 0 tests. | issue #30 |
| design | `docs/design-system.md` §5: sin escala tipográfica nombrada; `Toaster` sin variantes warning/info; sin wrapper de alert-dialog no destructivo; colores hardcodeados en `NnyaTable.tsx`. | issue #31 |
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
- **Rol rot: `roles` con 7 filas y 6 seed users legacy sin `auth_user_id`** (issue #3) — `prompts/017`. Los 6 usuarios eran datos de prueba: se borraron (sin filas dependientes por FK `RESTRICT`, verificado antes de borrar) junto con los 5 roles legacy (`Abogado/a`, `Administrador`, `Médico/a`, `Psicólogo/a`, `Trabajador Social`). Solo quedan `Admin`/`Equipo Tecnico` y el usuario real (`admin@arguelloinfancias.com`). Migración `20260915181604`.
- **Audit log no cableado** (issue #2) — `prompts/018`. Resuelta la decisión A/B/C de `prompts/012` (Jordy eligió Opción C): `fn_audit_trigger()` + `trg_audit_*` en las 27 tablas de negocio (todas menos `audit_log`). Verificado con un UPDATE de prueba en `nnya` → quedó registrado en `audit_log` con `tabla`/`operacion`/`registro_id` correctos. Migración `20260915182618`.
- **`types/database.types.ts` escrito a mano** (issue #8) — `prompts/020`. Generado `types/database.generated.ts` con `mcp__supabase__generate_typescript_types` (fuente de verdad regenerable); `database.types.ts` reescrito para derivar de ahí, angostando los `CHECK` a sus uniones literales y agregando las relaciones opcionales (`nnya?`, `usuarios?`, etc.) que el generador no infiere. Comparar campo por campo contra las 28 tablas reveló un `Actividad` duplicado (dead code, eliminado) y que `legajo_id` era `nullable` sin necesidad en 7 tablas. Cero cambios necesarios en el resto de la app (`tsc --noEmit` y `npm run build` limpios sin tocar otro archivo).
- **`legajo_id` nullable sin necesidad en 7 tablas** (`turnos`, `incidentes`, `diagnosticos`, `medicamentos`, `informes`, `documentos`, `audiencias_judiciales`) — `prompts/020`. Descubierto al regenerar los tipos (issue #8): la columna no tenía `NOT NULL` pese a que todo formulario de alta ya lo exige. Verificado 0 filas con `legajo_id NULL` antes de aplicar `ALTER TABLE ... SET NOT NULL` en las 7 tablas. Migración `20260915193141`. Los tipos de dominio ya no necesitan angostar ese campo manualmente.
- **DNI: doc corregida en vez de cifrado real** (issue #11) — `prompts/021`. Jordy decidió no implementar cifrado (AES-256 vía `pgcrypto` rompería `UNIQUE(dni)` y la búsqueda parcial sin agregar columna de hash aparte, y la clave terminaría viviendo igual dentro de Postgres — sin ganancia real de seguridad para el esfuerzo). `AGENTS-WEB.md` § Seguridad ya era honesto; se corrigió la única afirmación falsa que quedaba activa, en `docs/evolucion/00-RESUMEN-EJECUTIVO-FINAL.md` (documento histórico de Enero 2025), con una nota aclarando que es la spec aspiracional pre-implementación, no el estado real.
- **FASE D: UI de `turnos_personal`** (issue #6) — `prompts/023`. Firma doble de traspaso resuelta separando "Entregar mi turno"/"Recibir turno" en dos acciones ligadas siempre a la identidad de quien está logueado (RLS sola no alcanza a garantizar que el receptor sea otra persona). Encontró y corrigió 2 bugs reales: colisión de resaltado en el sidebar entre `/turnos` y `/turnos-personal`, y el form de edición no podía guardar un turno ya `entregado`.
- **`README.md` boilerplate de `create-next-app`** (issue #12) — reescrito con qué es el proyecto, stack, cómo levantar el entorno local, variables de entorno reales (confirmadas por grep de `process.env` en el código, no inventadas) y estructura, con `AGENTS-WEB.md` como fuente de verdad del resto. De paso se corrigió el diagrama de arquitectura de este mismo archivo, que todavía decía que los tipos se escriben a mano (desactualizado desde `prompts/020`).
- **`ON DELETE CASCADE` en `nnya_id`** (issue #16, hallazgo del review de mobile#18) — `prompts/025`. El alcance real era mucho mayor a lo que decía la tarjeta (`novedades`/`incidentes`): las 14 tablas de negocio con `nnya_id` tenían `CASCADE` (todas menos `legajos`, que ya estaba en `RESTRICT`). Cambiadas las 14 a `RESTRICT` — `SET NULL` no era viable (`nnya_id` es `NOT NULL` en las 14) y además hubiera destruido el rastro de auditoría que la tarjeta busca proteger. Verificado que ningún hook del código hace `delete` sobre `nnya` (siempre se usa `activo=false`), así que no cambia ningún comportamiento actual. Migración `20260916011716`.
- **FASE E: UI de seguimiento post-egreso** (issue #7) — `prompts/026`. Encontró un bug bloqueante: `NnyaForm` dejaba elegir `estado_actual = 'Egresado'` sin pedir nunca `fecha_egreso`, violando el `CHECK chk_nnya_fecha_egreso_coherente` de `prompts/011` — hoy corregido (campo condicional + `.refine()` con mensaje legible). El "cron 30/60 días" se resolvió con un trigger de BD (`fn_crear_seguimiento_post_egreso`, `AFTER UPDATE ON nnya`, dispara cuando `fecha_egreso` pasa de `NULL` a un valor) en vez de infraestructura de cron externa — mismo patrón que `fn_crear_alerta_incidente_grave`. Incluye backfill para el NNyA que ya estaba egresado en el seed. Verificado en vivo: egresar un NNyA generó sus 2 filas automáticamente, y registrar un contacto actualizó `contactado_por` correctamente.

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
