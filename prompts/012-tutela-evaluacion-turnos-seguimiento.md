# 012 — Tutela/revinculación, evaluación institucional, turnos de personal y seguimiento post-egreso (FASE A1)

## Objetivo

Crear las 10 tablas de `AGENTS.md` sección 11, FASE A, A1: soporte de datos para tutela y
revinculación (Procesos 1.1 y 1.5), evaluación institucional mensual (Proceso 1.8) y
acompañamiento diario con firma doble de turno (Proceso 1.3). A0 (`fecha_egreso` en `nnya`)
ya está implementado (`prompts/011-fecha-egreso-nnya.md`) y varias de estas tablas lo
referencian (`seguimiento_post_egreso.fecha_programada`).

## Antes de escribir el plan — convenciones reales verificadas

Se leyó `supabase/migrations/20260620000031_clean_schema.sql` completo (es la migración
"limpia y consolidada" que **reemplaza las 001-030 en una DB nueva** — es la fuente de
verdad real, no las migraciones individuales superseded) y se verificó contra la base
conectada:

- **Tipos y estilo**: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`; `VARCHAR(n)` para
  nombres/apellidos (100), teléfono (20), email (255), dni (20); `TEXT` para
  descripciones/observaciones largas; enums como `VARCHAR` corto + `CHECK ... IN (...)`;
  `TIMESTAMPTZ NOT NULL DEFAULT NOW()` para `created_at`/`updated_at`.
- **Índices**: `idx_<tabla>_<columna(s)>` para índices normales, `uq_<algo>` para únicos
  parciales (ej. `uq_legajo_activo_por_nnya` en `legajos`).
- **FKs a `usuarios`**: en las 17 tablas existentes, todo campo `created_by`/`*_id` opcional
  hacia `usuarios` es **nullable + `ON DELETE SET NULL`** (nunca `NOT NULL`).
- **RLS**: habilitado en las 17 tablas + políticas `Admin`/`Equipo Tecnico` en la misma
  migración que las crea.

## (a) Cifrado de `nnya.dni` — verificado, no lo que dice `AGENTS.md`

El prompt pedía replicar "el mismo tipo/cifrado que usa `nnya.dni`". Verificado contra la
base real:

- `nnya.dni` es `character varying(20)`, **texto plano**, con `UNIQUE`. Igual `tutores.dni`.
- La extensión `pgcrypto` está instalada en la base, pero `grep` sobre las 31 migraciones no
  encontró ni un solo uso (`pgp_sym_encrypt`, `crypt(`, `digest(`) — está disponible pero no
  se usa para nada.
- `AGENTS.md` sección 7 dice *"Cifrado: nombres, DNI, datos sanitarios → AES-256 en
  Postgres"* y sección 5 dice *"dni ENCRYPTED"* — **esto no es cierto en el esquema real**.
  Es la misma imprecisión ya señalada en el resumen de la sesión anterior sobre esa sección
  de `AGENTS.md` (mezcla aspiracional con lo implementado).

**Aplicado a `referentes.dni`**: `VARCHAR(20) NOT NULL UNIQUE`, texto plano — igual que
`nnya.dni`/`tutores.dni`. No se inventa un mecanismo de cifrado nuevo (el prompt pedía
explícitamente no hacer eso). Si en algún momento se decide cifrar DNI de verdad, es un
cambio transversal a `nnya`+`tutores`+`referentes` juntos, no algo para resolver acá.

## (b) Choques con la convención del proyecto (gana el proyecto, salvo que digas lo contrario)

1. **`created_by`/`consultado_por` en `NOT NULL`** (pedido en `referentes`,
   `vinculos_tutela`, `validaciones_renaper`, `transferencia_auh`,
   `evaluacion_institucional`, `evaluacion_institucional_asistentes`): la convención real
   es nullable + `ON DELETE SET NULL`. Pero forzar nullable rompería la trazabilidad
   "quién hizo el alta" que estas tablas necesitan (Proceso 1.7).
   **Resolución aplicada**: `NOT NULL` + `ON DELETE RESTRICT` en vez de `SET NULL`. Esto no
   choca en la práctica porque el proyecto nunca borra `usuarios` en duro — confirmado por
   grep en `hooks/usuarios/` — siempre se usa el flag `activo` (mismo patrón que
   `nnya.activo`/`tutores.activo`). `RESTRICT` nunca se va a disparar, y de paso deja la
   columna `NOT NULL` como pedías. Los campos que vos mismo dejaste opcionales
   (`propuestas_mejora.responsable_id`, `turnos_personal.entregado_por/recibido_por`,
   `seguimiento_post_egreso.contactado_por`) se dejaron nullable + `SET NULL`, sin cambios.
2. **Orden `apellido`/`nombre` y tipo `TEXT` en `referentes`**: el prompt pedía
   `apellido`/`nombre` en ese orden y `TEXT`. Las 17 tablas usan siempre `nombre` antes que
   `apellido`, y `VARCHAR(100)` (no `TEXT`) para ambos. Se aplicó el orden/tipo del
   proyecto; el índice de búsqueda queda igual, `(apellido, nombre)`, porque eso es sobre
   patrón de consulta, no de almacenamiento.
3. **Trigger de `updated_at`**: pediste agregarlo "si el proyecto tiene esa función".
   Verificado: no la tiene. Existe `storage.update_updated_at_column()`, pero es interna de
   Supabase Storage (para `storage.objects`), no se usa en ninguna de las 17 tablas de
   `public`. Confirmado además por grep en `hooks/`: las 16 mutaciones de "actualizar" en el
   código seatean `updated_at` a mano (`useUpdateNnya`, `useUpdateLegajo`, etc.). **No se
   agrega trigger** — mismo comportamiento que el resto del esquema.
4. **Audit trigger `trg_audit_*`** — este es el hallazgo grande, ver sección siguiente.

### El patrón `trg_audit_*` que pedías replicar no existe en la base real

Ya lo habíamos detectado de rebote en A0 (`prompts/011-fecha-egreso-nnya.md`), pero acá es
central porque el prompt pide aplicarlo activamente. Verificado de nuevo, más a fondo:

- `pg_proc` no tiene ninguna función `fn_audit_trigger` (ni ninguna función de auditoría).
- `pg_trigger` no tiene ningún `trg_audit_%` en ninguna tabla.
- **La causa raíz**: `20260620000031_clean_schema.sql` — la migración que según su propio
  comentario "reemplaza las migraciones 001-030 en una DB nueva" y que evidentemente es la
  que efectivamente construyó la base conectada (columnas de `audit_log` coinciden 1:1) —
  crea la tabla `audit_log` pero **nunca crea `fn_audit_trigger()` ni los 14 triggers**.
  La migración vieja que sí los definía (`20260514000018_audit_log.sql`) quedó
  completamente superseded, no solo desactualizada en columnas como pensábamos en A0.
- Osea: no hay ningún "patrón exacto de las 17 tablas" para copiar, porque ninguna de las
  17 tablas está auditada hoy. `AGENTS.md` sección 7 y el diagrama de sección 3 (`audit_log
  IMMUTABLE`, "Audit triggers en cada tabla (automáticos)") describen un sistema que no
  está desplegado.

**No decidí esto por mi cuenta.** Esta migración **no crea triggers de auditoría** (ni para
las 10 tablas nuevas ni, obviamente, para las 17 viejas) — mantiene la migración enfocada en
A1 (crear tablas) tal como lo separa tu propio `AGENTS.md` (A1 vs A2 aparte). Elegí entre
tres opciones y quiero tu confirmación antes de aplicar:

- **Opción A (aplicada en el plan de abajo)**: no agregar auditoría ahora. Documentar el
  gap (ya está documentado acá y en 011). Un futuro prompt dedicado decide si se recrea
  `fn_audit_trigger()` (con las columnas reales de `audit_log`: `registro_id`, `usuario_id`,
  `created_at`) y a qué conjunto de tablas se aplica — probablemente las 27 juntas, para no
  dejar una auditoría parcial que confunda más de lo que ayuda.
- **Opción B**: recrear `fn_audit_trigger()` ahora mismo y aplicar `trg_audit_*` solo a las
  10 tablas nuevas, dejando las 17 viejas sin auditar (inconsistente, pero cubre lo nuevo
  desde ya).
- **Opción C**: recrear `fn_audit_trigger()` y aplicarlo a las 27 tablas (10 nuevas + 17
  viejas) en esta misma migración — es más alcance del que pediste ("crear 10 tablas"), pero
  es la única opción que dejaría el sistema realmente auditado como dice `AGENTS.md`.

Si preferís B o C en vez de A, decímelo y ajusto el archivo antes de aplicar.

## (c) Índice único parcial de `vinculos_tutela` — ¿conflicto con algo existente?

`vinculos_tutela` es una tabla nueva y vacía: no puede haber conflicto de *datos* porque no
hay filas todavía. Sí hay un punto conceptual para que tengas en cuenta, no para decidir acá:

- El proyecto ya tiene un modelo de "tutor" activo y en uso: `tutores` + `nnya_tutores`
  (con `es_principal BOOLEAN`), con UI real (`components/entities/tutores/TutorForm.tsx` y
  `TutorTable.tsx`). Ese modelo **no** tiene vigencia temporal ni exclusividad — permite
  varios tutores simultáneos por NNyA, distinguidos solo por `es_principal`.
- `vinculos_tutela` modela algo distinto y más estricto: tutela con vigencia en el tiempo,
  un solo vínculo `vigente` a la vez, y tres tipos legales distintos
  (`tutela_residencia`/`revinculacion_familiar`/`referente_afectivo`). No reemplaza a
  `tutores`/`nnya_tutores` ni los toca.
- No hay conflicto técnico, pero quedan dos conceptos de "tutela" en paralelo en el mismo
  esquema (uno viejo y simple, uno nuevo y con vigencia real). Si en algún momento querés
  reconciliarlos o deprecar `tutores`/`nnya_tutores` a favor de `vinculos_tutela`, es una
  decisión de producto — no se toca en esta migración.

## Plan de la migración

Archivo nuevo: `supabase/migrations/<timestamp>_create_tutela_evaluacion_turnos_seguimiento.sql`
(el timestamp se fija al momento de aplicar, después de A0 que ya usa `20260826000032`).

Orden de creación (por dependencias de FK): `referentes` → `vinculos_tutela` →
`validaciones_renaper` → `transferencia_auh` → `evaluacion_institucional` →
`evaluacion_institucional_asistentes` → `evaluacion_institucional_casos` →
`propuestas_mejora` → `turnos_personal` → `seguimiento_post_egreso`. Al final, `ENABLE ROW
LEVEL SECURITY` en las 10, sin políticas (llegan en A2). Sin triggers de auditoría (ver
sección (b) arriba). Sin datos semilla.

```sql
-- ============================================================
-- BLOQUE 1: Tutela y referentes (Procesos 1.1 y 1.5)
-- ============================================================

-- 1. referentes (persona externa: familiar, educador, vecino, etc.)
CREATE TABLE IF NOT EXISTS referentes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               VARCHAR(100) NOT NULL,
  apellido             VARCHAR(100) NOT NULL,
  dni                  VARCHAR(20) UNIQUE NOT NULL,
  fecha_nacimiento     DATE,
  tipo                 VARCHAR(20) NOT NULL
                       CHECK (tipo IN ('familiar','educador','vecino','otro')),
  vinculo_descripcion  TEXT,
  telefono             VARCHAR(20),
  email                VARCHAR(255),
  domicilio            TEXT,
  activo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_by           UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referentes_apellido_nombre ON referentes(apellido, nombre);
CREATE INDEX IF NOT EXISTS idx_referentes_activo ON referentes(activo);

-- 2. vinculos_tutela (quién tiene la tutela del NNyA, y desde cuándo)
CREATE TABLE IF NOT EXISTS vinculos_tutela (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id              UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  tipo                 VARCHAR(30) NOT NULL
                       CHECK (tipo IN ('tutela_residencia','revinculacion_familiar','referente_afectivo')),
  usuario_id           UUID REFERENCES usuarios(id) ON DELETE RESTRICT,
  referente_id         UUID REFERENCES referentes(id) ON DELETE RESTRICT,
  vigente_desde        DATE NOT NULL,
  vigente_hasta        DATE,
  estado               VARCHAR(20) NOT NULL DEFAULT 'vigente'
                       CHECK (estado IN ('propuesto','vigente','finalizado','revocado')),
  resolucion_respaldo  TEXT,
  motivo_finalizacion  TEXT,
  observaciones        TEXT,
  created_by           UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (num_nonnulls(usuario_id, referente_id) = 1),
  CHECK (tipo <> 'tutela_residencia' OR usuario_id IS NOT NULL),
  CHECK (tipo NOT IN ('revinculacion_familiar','referente_afectivo') OR referente_id IS NOT NULL),
  CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_vinculo_vigente_por_nnya
  ON vinculos_tutela(nnya_id) WHERE estado = 'vigente';

CREATE INDEX IF NOT EXISTS idx_vinculos_tutela_nnya_desde ON vinculos_tutela(nnya_id, vigente_desde);
CREATE INDEX IF NOT EXISTS idx_vinculos_tutela_referente ON vinculos_tutela(referente_id);
CREATE INDEX IF NOT EXISTS idx_vinculos_tutela_estado ON vinculos_tutela(estado);

-- 3. validaciones_renaper (auditoría de cada consulta de DNI — Proceso 1.7)
CREATE TABLE IF NOT EXISTS validaciones_renaper (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referente_id        UUID NOT NULL REFERENCES referentes(id) ON DELETE CASCADE,
  momento             VARCHAR(20) NOT NULL
                      CHECK (momento IN ('alta_referente','egreso','reintento')),
  dni_consultado      VARCHAR(20) NOT NULL,
  estado_dni          VARCHAR(20) NOT NULL
                      CHECK (estado_dni IN ('vigente','vencido','inexistente','error_servicio')),
  tiene_antecedentes  BOOLEAN,
  resultado           VARCHAR(20) NOT NULL
                      CHECK (resultado IN ('aprobado','rechazado','no_concluyente')),
  respuesta_cruda     JSONB,
  consultado_por      UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  consultado_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validaciones_renaper_referente_fecha
  ON validaciones_renaper(referente_id, consultado_at DESC);
CREATE INDEX IF NOT EXISTS idx_validaciones_renaper_resultado ON validaciones_renaper(resultado);

-- 4. transferencia_auh (traspaso de la asignación universal — Proceso 1.5, sin montos)
CREATE TABLE IF NOT EXISTS transferencia_auh (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id        UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  vinculo_id     UUID NOT NULL REFERENCES vinculos_tutela(id) ON DELETE RESTRICT,
  fecha_gestion  DATE,
  fecha_efectiva DATE,
  estado         VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','en_gestion','transferida','rechazada','no_corresponde')),
  organismo      VARCHAR(100),
  observaciones  TEXT,
  created_by     UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (nnya_id, vinculo_id)
);

CREATE INDEX IF NOT EXISTS idx_transferencia_auh_estado ON transferencia_auh(estado);

-- ============================================================
-- BLOQUE 2: Evaluación Institucional (Proceso 1.8)
-- ============================================================

-- 5. evaluacion_institucional
CREATE TABLE IF NOT EXISTS evaluacion_institucional (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_mes    INT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio   INT NOT NULL,
  fecha_reunion  TIMESTAMPTZ NOT NULL,
  observaciones  TEXT,
  estado         VARCHAR(20) NOT NULL DEFAULT 'convocada'
                 CHECK (estado IN ('convocada','realizada','cancelada')),
  created_by     UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (periodo_mes, periodo_anio)
);

-- 6. evaluacion_institucional_asistentes
CREATE TABLE IF NOT EXISTS evaluacion_institucional_asistentes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id  UUID NOT NULL REFERENCES evaluacion_institucional(id) ON DELETE CASCADE,
  usuario_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  asistio        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (evaluacion_id, usuario_id)
);

-- 7. evaluacion_institucional_casos
CREATE TABLE IF NOT EXISTS evaluacion_institucional_casos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id          UUID NOT NULL REFERENCES evaluacion_institucional(id) ON DELETE CASCADE,
  nnya_id                UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  resumen_situacion      TEXT NOT NULL,
  indicador_avance       INT CHECK (indicador_avance BETWEEN 1 AND 5),
  recomendaciones        TEXT,
  seguimiento_requerido  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (evaluacion_id, nnya_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluacion_casos_nnya ON evaluacion_institucional_casos(nnya_id);

-- 8. propuestas_mejora
CREATE TABLE IF NOT EXISTS propuestas_mejora (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id     UUID NOT NULL REFERENCES evaluacion_institucional(id) ON DELETE CASCADE,
  descripcion       TEXT NOT NULL,
  tipo              VARCHAR(20) NOT NULL DEFAULT 'mejora'
                    CHECK (tipo IN ('mejora','capacitacion')),
  area              VARCHAR(20)
                    CHECK (area IN ('educativa','sanitaria','social','institucional','protocolos')),
  responsable_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_vencimiento DATE,
  estado            VARCHAR(20) NOT NULL DEFAULT 'abierto'
                    CHECK (estado IN ('abierto','en_progreso','completado','cancelado')),
  observaciones     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_propuestas_mejora_estado ON propuestas_mejora(estado);
CREATE INDEX IF NOT EXISTS idx_propuestas_mejora_responsable ON propuestas_mejora(responsable_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_mejora_vencimiento ON propuestas_mejora(fecha_vencimiento);

-- ============================================================
-- BLOQUE 3: Acompañamiento diario (Proceso 1.3)
-- ============================================================

-- 9. turnos_personal (cobertura de turno y traspaso de jornada, firma doble)
CREATE TABLE IF NOT EXISTS turnos_personal (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  fecha               DATE NOT NULL,
  turno               VARCHAR(10) NOT NULL CHECK (turno IN ('mañana','tarde','noche')),
  hora_inicio         TIMESTAMPTZ,
  hora_cierre         TIMESTAMPTZ,
  estado              VARCHAR(20) NOT NULL DEFAULT 'planificado'
                      CHECK (estado IN ('planificado','en_curso','entregado','cerrado','no_cubierto')),
  novedades_traspaso  TEXT,
  entregado_por       UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  entregado_at        TIMESTAMPTZ,
  recibido_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  recibido_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (usuario_id, fecha, turno),
  CHECK (hora_cierre IS NULL OR hora_cierre > hora_inicio),
  CHECK (estado <> 'cerrado' OR (entregado_at IS NOT NULL AND recibido_at IS NOT NULL)),
  CHECK (recibido_at IS NULL OR entregado_at IS NULL OR recibido_at >= entregado_at),
  CHECK (entregado_por IS NULL OR entregado_por = usuario_id),
  CHECK (recibido_por IS NULL OR recibido_por <> usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_turnos_personal_fecha_turno ON turnos_personal(fecha, turno);
CREATE INDEX IF NOT EXISTS idx_turnos_personal_estado ON turnos_personal(estado);

-- ============================================================
-- BLOQUE 4: Egreso (Proceso 1.5)
-- ============================================================

-- 10. seguimiento_post_egreso (solo 30 y 60 días, según el proceso 1.5 literal)
CREATE TABLE IF NOT EXISTS seguimiento_post_egreso (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nnya_id                 UUID NOT NULL REFERENCES nnya(id) ON DELETE CASCADE,
  vinculo_id              UUID REFERENCES vinculos_tutela(id) ON DELETE SET NULL,
  dias_post_egreso        INT NOT NULL CHECK (dias_post_egreso IN (30, 60)),
  fecha_programada        DATE NOT NULL,
  fecha_contacto          TIMESTAMPTZ,
  contacto_realizado      BOOLEAN NOT NULL DEFAULT FALSE,
  contacto_efectivo       BOOLEAN,
  escolaridad             VARCHAR(20) CHECK (escolaridad IN ('cumple','parcial','no_cumple','no_corresponde')),
  salud                   VARCHAR(20) CHECK (salud IN ('cumple','parcial','no_cumple','no_corresponde')),
  terapias                VARCHAR(20) CHECK (terapias IN ('cumple','parcial','no_cumple','no_corresponde')),
  percibe_auh             BOOLEAN,
  detalle_incumplimiento  TEXT,
  observaciones           TEXT,
  indicador_reinsercion   INT CHECK (indicador_reinsercion BETWEEN 1 AND 5),
  requiere_intervencion   BOOLEAN NOT NULL DEFAULT FALSE,
  contactado_por          UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (nnya_id, dias_post_egreso)
);

CREATE INDEX IF NOT EXISTS idx_seguimiento_post_egreso_fecha ON seguimiento_post_egreso(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_seguimiento_post_egreso_contacto ON seguimiento_post_egreso(contacto_realizado);
CREATE INDEX IF NOT EXISTS idx_seguimiento_post_egreso_intervencion ON seguimiento_post_egreso(requiere_intervencion);

-- ============================================================
-- RLS: habilitar en las 10 tablas nuevas (sin políticas — llegan en A2)
-- ============================================================

ALTER TABLE referentes                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinculos_tutela                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE validaciones_renaper                ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencia_auh                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluacion_institucional            ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluacion_institucional_asistentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluacion_institucional_casos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuestas_mejora                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_personal                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento_post_egreso             ENABLE ROW LEVEL SECURITY;
```

## Supuestos

- `referentes.dni` y `validaciones_renaper.dni_consultado` quedan en texto plano, igual que
  `nnya.dni`/`tutores.dni` hoy — no se agrega cifrado nuevo (ver (a)).
- `created_by`/`consultado_por` quedan `NOT NULL` con `ON DELETE RESTRICT` en vez de la
  convención nullable + `SET NULL` del resto del esquema — justificado en (b), nunca se
  dispara en la práctica porque `usuarios` no se borra en duro.
- Sin triggers de auditoría en esta migración (ni para las 10 tablas nuevas ni para las 17
  viejas) — ver (b), pendiente de tu confirmación sobre A/B/C.
- Sin trigger de `updated_at` — el proyecto no tiene esa función, se setea a mano como en
  el resto (ver (b)).
- RLS habilitado sin políticas: las 10 tablas quedan inaccesibles vía la app (ni para Admin)
  hasta que A2 agregue las políticas — es lo que pediste explícitamente.
- No se toca `tutores`/`nnya_tutores` — quedan en paralelo a `vinculos_tutela`, ver (c).
- Sin datos semilla.

## Seguridad

- `validaciones_renaper.respuesta_cruda` (JSONB) puede traer datos personales del
  referente. No hay riesgo de exposición *ahora* porque RLS sin políticas bloquea todo
  acceso vía API — pero es una nota para A2: sus políticas deberían restringirlo igual que
  `informes`/`documentos` (Admin/Equipo Tecnico, nunca en una vista de listado general), y
  para FASE B: la UI no debe exponer `respuesta_cruda` en ningún listado.
- Ningún `service_role` ni secreto se toca en esta migración.

## Criterios de aceptación

- `list_tables` muestra las 10 tablas nuevas (27 en total con las 17 existentes).
- Cada una de las 10 con `rowsecurity = true` (confirmable vía `pg_tables`).
- Las 17 tablas existentes intactas (mismo conteo de filas).
- `INSERT` de prueba en `vinculos_tutela` con dos filas `vigente` para el mismo `nnya_id` →
  rechazado por `uq_vinculo_vigente_por_nnya`.
- `INSERT` con `usuario_id` Y `referente_id` seteados a la vez → rechazado por el `CHECK
  num_nonnulls`.
- `INSERT`/`UPDATE` en `turnos_personal` a `estado='cerrado'` sin `entregado_at`/
  `recibido_at` → rechazado.
- **No** habrá fila en `audit_log` tras el `INSERT` de prueba (es el resultado esperado
  dado que no se agregan triggers en esta migración — lo contrario a lo que pedía la
  validación original del prompt, documentado en (b)).

## Chequeos

- Aplicar la migración contra el proyecto conectado.
- Correr las queries de validación de "Criterios de aceptación".
- `npx tsc --noEmit` — evaluar si hace falta tocar `types/database.types.ts`: como RLS
  queda sin políticas, estas 10 tablas no son usables desde la app todavía (no hay
  hooks/componentes que las toquen), así que agregar los tipos ahora es opcional; se puede
  hacer en el mismo paso o diferir a FASE B cuando se construya la UI. Mi sugerencia:
  agregarlos ahora igual (es barato y mantiene `database.types.ts` sincronizado con el
  schema real, evitando que se acumule más deuda del punto ya señalado en
  `03-incumplimientos-debilidades-SOFI.md`).

## Verificación manual

- Ver las 10 tablas nuevas en el editor de tablas de Supabase, vacías.
- Confirmar en `Database > Roles/Policies` que no hay políticas nuevas (esperado, llegan en
  A2).

---

**Estado**: pendiente de aprobación. Antes de aplicar necesito que confirmes:

1. **Auditoría** (b): ¿Opción A (sin triggers, documentado, prompt aparte para restaurar
   auditoría real en las 27 tablas) — recomendada — u Opción B/C?
2. **`created_by` `NOT NULL` + `RESTRICT`** (b.1): ¿de acuerdo con esa resolución, o preferís
   volver a la convención nullable + `SET NULL` del resto del esquema?
3. Si no decís nada puntual sobre 1 y 2, aplico tal como está escrito arriba (Opción A +
   `NOT NULL`/`RESTRICT`).
