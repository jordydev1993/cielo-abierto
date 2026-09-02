# Prompts A0 + A1 + A2 (DEFINITIVO v2)

Incorpora el relevamiento de tutela/revinculación y los datos reales del
esquema (`nnya`, `usuarios.auth_user_id`, gap de `fecha_egreso`).

## Alcance final: 10 tablas nuevas + 1 columna

| Tabla | Proceso que la origina |
|---|---|
| referentes | 1.1 Ingreso / 1.5 Egreso (persona externa: familiar, educador, vecino) |
| vinculos_tutela | 1.1 (tutela de la residencia) / 1.5 (revinculación) |
| validaciones_renaper | 1.1 y 1.5 (validación de DNI del tutor) |
| transferencia_auh | 1.5 (traspaso de la asignación universal) |
| evaluacion_institucional | 1.8 |
| evaluacion_institucional_asistentes | 1.8 (convocatoria) |
| evaluacion_institucional_casos | 1.8 (revisión de casos) |
| propuestas_mejora | 1.8 (propuestas + acuerdos) |
| turnos_personal | 1.3 (inicio de jornada + traspaso) |
| seguimiento_post_egreso | 1.5 (seguimiento 30-60 días) |
| `nnya.fecha_egreso` (columna) | 1.5 — ver Prompt A0 |

**Fuera de alcance:** fondos institucionales, gastos, inventario, RRHH/nómina.
`transferencia_auh` NO es gestión de dinero: registra que el trámite de
traspaso de la asignación se hizo y que el egresado la sigue percibiendo.

---

## PROMPT A0: cerrar el gap de `fecha_egreso`

```
CONTEXTO:
- El proceso 1.5 (Egreso o Reintegración Familiar) necesita la fecha de
  egreso como dato de primera clase: de ella se calculan los seguimientos
  a 30 y 60 días.
- Hoy no existe. Se infiere combinando nnya.estado_actual = 'Egresado'
  con legajos.fecha_cierre del legajo correspondiente.
- Ese cálculo es frágil: legajos.fecha_cierre es el cierre administrativo
  del legajo, que puede no coincidir con el día en que el NNyA egresó, y
  un NNyA puede tener más de un legajo a lo largo del tiempo.

TAREA:
1. Agregar columna a nnya:
   - fecha_egreso DATE NULL

2. Backfill de datos existentes:
   - Para cada nnya con estado_actual = 'Egresado', tomar
     legajos.fecha_cierre del legajo más reciente de ese NNyA.
   - Si hay NNyA 'Egresado' sin legajo cerrado, dejar NULL y listarlos
     en el output para revisión manual.

3. Constraint de coherencia:
   - CHECK: (estado_actual = 'Egresado') = (fecha_egreso IS NOT NULL)
   - IMPORTANTE: verificá primero que el backfill deje 0 filas
     inconsistentes. Si quedan NNyA 'Egresado' sin fecha, NO apliques el
     CHECK todavía — reportámelo y lo resolvemos antes.

4. Validar:
   - SELECT count(*) FROM nnya WHERE estado_actual='Egresado' AND fecha_egreso IS NULL
     → debe dar 0 (o la lista para revisar)
   - Las 17 tablas siguen intactas
   - audit_log registra el cambio de esquema si el proyecto lo hace

ARCHIVO:
- supabase/migrations/<timestamp>_add_fecha_egreso_nnya.sql

Escribí el plan y avisame antes de implementar. Si en el backfill
encontrás casos raros (NNyA egresado con varios legajos cerrados,
fechas incoherentes), listámelos en vez de decidir vos.
```

---

## PROMPT A1: CREATE TABLE — 10 tablas nuevas

```
CONTEXTO:
- arguello-infancias tiene 17 tablas y 31 migraciones existentes
- Tabla de NNyA: `nnya`
- Vínculo con Auth: `usuarios.auth_user_id` (usuarios.id es id propio de
  la app, distinto del id de Supabase Auth)
- Roles reales: 'Admin' / 'Equipo Tecnico'
- Acceso amplio: Equipo Tecnico ve todo, sin restricción por legajo
- El sistema NO gestiona fondos, gastos, inventario ni nómina

REGLAS DE NEGOCIO RELEVADAS (nuevas, leelas antes del esquema):
- Al ingresar el NNyA, la tutela queda a cargo del responsable de la
  residencia que lo recibe. Ese responsable es un usuario del sistema.
- Durante la permanencia puede haber revinculación con un familiar o un
  referente afectivo (educador, familiar, vecino). Esa persona es externa
  al sistema.
- Al egresar, la tutela se transfiere a ese referente, se traspasa la
  asignación universal a su nombre, y se hace seguimiento de que cumpla
  con educación, salud y terapias.
- Por lo tanto la tutela NO es un campo del NNyA: es un vínculo con
  vigencia en el tiempo, del que existe una sucesión (residencia →
  referente). El esquema debe conservar el histórico completo.

ANTES DE ESCRIBIR EL PLAN:
- Leé clean_schema.sql y copiá las convenciones reales del proyecto:
  naming, tipos, timestamps, índices, y el patrón exacto del audit trigger.
- CRÍTICO: fijate cómo se almacena y cifra `nnya.dni` (el proyecto cifra
  datos sensibles). `referentes.dni` debe seguir EXACTAMENTE la misma
  convención. No inventes un mecanismo nuevo — decime cuál usa el
  proyecto y aplicá ese.
- Si algo de abajo choca con la convención del proyecto, gana el proyecto.

TAREA: crear 10 tablas en una migración.

--- BLOQUE 1: Tutela y referentes (Procesos 1.1 y 1.5) ---

1. referentes (persona externa: familiar, educador, vecino)
   - id UUID PK DEFAULT gen_random_uuid()
   - dni <mismo tipo/cifrado que nnya.dni> NOT NULL
   - apellido TEXT NOT NULL
   - nombre TEXT NOT NULL
   - fecha_nacimiento DATE
   - tipo TEXT NOT NULL
     CHECK IN ('familiar','educador','vecino','otro')
   - vinculo_descripcion TEXT   -- 'tía materna', 'docente de 5to', etc.
   - telefono TEXT
   - email TEXT
   - domicilio TEXT
   - activo BOOLEAN NOT NULL DEFAULT true
   - created_by UUID NOT NULL → usuarios(id)
   - created_at / updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   - UNIQUE (dni)  -- si el dni va cifrado, resolvé la unicidad como lo
     haga el proyecto en nnya; si ahí no hay unique, decímelo y lo vemos
   - ÍNDICE: (apellido, nombre), (activo)

   NOTA: 'referente afectivo' no es un tipo, es el rol que cumple.
   Un educador o un vecino puede ser referente afectivo. Por eso el rol
   va en vinculos_tutela, no acá.

2. vinculos_tutela (quién tiene la tutela del NNyA, y desde cuándo)
   - id UUID PK DEFAULT gen_random_uuid()
   - nnya_id UUID NOT NULL → nnya(id)
   - tipo TEXT NOT NULL
     CHECK IN ('tutela_residencia','revinculacion_familiar','referente_afectivo')
   - usuario_id UUID → usuarios(id)      -- responsable de la residencia
   - referente_id UUID → referentes(id)  -- persona externa
   - vigente_desde DATE NOT NULL
   - vigente_hasta DATE
   - estado TEXT NOT NULL DEFAULT 'vigente'
     CHECK IN ('propuesto','vigente','finalizado','revocado')
   - resolucion_respaldo TEXT   -- resolución SENAF / oficio del juzgado
   - motivo_finalizacion TEXT
   - observaciones TEXT
   - created_by UUID NOT NULL → usuarios(id)
   - created_at / updated_at

   CONSTRAINTS:
   - CHECK: exactamente uno de usuario_id / referente_id no es NULL
     (num_nonnulls(usuario_id, referente_id) = 1)
   - CHECK: tipo='tutela_residencia' → usuario_id IS NOT NULL
   - CHECK: tipo IN ('revinculacion_familiar','referente_afectivo')
            → referente_id IS NOT NULL
   - CHECK: vigente_hasta IS NULL OR vigente_hasta >= vigente_desde
   - ÍNDICE ÚNICO PARCIAL: un solo vínculo vigente por NNyA
     CREATE UNIQUE INDEX ... ON vinculos_tutela (nnya_id)
     WHERE estado = 'vigente';
   - ÍNDICES: (nnya_id, vigente_desde), (referente_id), (estado)

   RAZÓN del índice parcial: dos tutelas vigentes simultáneas sobre el
   mismo NNyA es un estado inválido — la sucesión residencia → referente
   exige cerrar la anterior antes de abrir la nueva.

   DELETE: nunca. Un vínculo terminado pasa a 'finalizado' o 'revocado'.

3. validaciones_renaper (auditoría de cada consulta de DNI)
   - id UUID PK DEFAULT gen_random_uuid()
   - referente_id UUID NOT NULL → referentes(id)
   - momento TEXT NOT NULL CHECK IN ('alta_referente','egreso','reintento')
   - dni_consultado TEXT NOT NULL  -- cifrado igual que el resto
   - estado_dni TEXT NOT NULL
     CHECK IN ('vigente','vencido','inexistente','error_servicio')
   - tiene_antecedentes BOOLEAN
   - resultado TEXT NOT NULL CHECK IN ('aprobado','rechazado','no_concluyente')
   - respuesta_cruda JSONB   -- payload completo, para auditoría
   - consultado_por UUID NOT NULL → usuarios(id)
   - consultado_at TIMESTAMPTZ NOT NULL DEFAULT now()
   - ÍNDICES: (referente_id, consultado_at DESC), (resultado)

   RAZÓN de tabla separada en vez de columnas en `referentes`:
   la validación se repite (alta y egreso, y reintentos si el servicio
   falla) y el resultado histórico no se puede pisar — el proceso 1.7
   exige trazabilidad. `referentes` no guarda estado de validación;
   se consulta la última fila de esta tabla.

   `tiene_antecedentes` es NULL cuando el servicio no respondió.
   'error_servicio' + 'no_concluyente' es el caso de RENAPER caído:
   NO es un rechazo, y la UI debe distinguirlo.

   ATENCIÓN: `respuesta_cruda` puede traer datos personales. Confirmá
   que quede cubierta por el mismo control de acceso que el resto de
   datos sensibles, y no la expongas en ninguna vista de listado.

4. transferencia_auh (traspaso de la asignación universal — Proceso 1.5)
   - id UUID PK DEFAULT gen_random_uuid()
   - nnya_id UUID NOT NULL → nnya(id)
   - vinculo_id UUID NOT NULL → vinculos_tutela(id)
   - fecha_gestion DATE
   - fecha_efectiva DATE
   - estado TEXT NOT NULL DEFAULT 'pendiente'
     CHECK IN ('pendiente','en_gestion','transferida','rechazada','no_corresponde')
   - organismo TEXT   -- ANSES u otro
   - observaciones TEXT
   - created_by UUID NOT NULL → usuarios(id)
   - created_at / updated_at
   - UNIQUE (nnya_id, vinculo_id)
   - ÍNDICE: (estado)

   ALCANCE: esto es seguimiento de un trámite, no administración de
   dinero. Sin montos, sin comprobantes, sin conciliación. Si más
   adelante hace falta registrar el monto, lo agregamos con una razón
   de proceso que lo justifique.

--- BLOQUE 2: Evaluación Institucional (Proceso 1.8) ---

5. evaluacion_institucional
   - id UUID PK DEFAULT gen_random_uuid()
   - periodo_mes INT NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12)
   - periodo_anio INT NOT NULL
   - fecha_reunion TIMESTAMPTZ NOT NULL
   - observaciones TEXT
   - estado TEXT NOT NULL DEFAULT 'convocada'
     CHECK IN ('convocada','realizada','cancelada')
   - created_by UUID NOT NULL → usuarios(id)
   - created_at / updated_at
   - UNIQUE (periodo_mes, periodo_anio)

6. evaluacion_institucional_asistentes
   - id UUID PK DEFAULT gen_random_uuid()
   - evaluacion_id UUID NOT NULL → evaluacion_institucional(id) ON DELETE CASCADE
   - usuario_id UUID NOT NULL → usuarios(id)
   - asistio BOOLEAN NOT NULL DEFAULT false
   - created_at
   - UNIQUE (evaluacion_id, usuario_id)
   RAZÓN de `asistio`: distinguir convocado de presente cubre la
   desviación documentada "ausencia de participantes clave".

7. evaluacion_institucional_casos
   - id UUID PK DEFAULT gen_random_uuid()
   - evaluacion_id UUID NOT NULL → evaluacion_institucional(id) ON DELETE CASCADE
   - nnya_id UUID NOT NULL → nnya(id)
   - resumen_situacion TEXT NOT NULL
   - indicador_avance INT CHECK (indicador_avance BETWEEN 1 AND 5)
   - recomendaciones TEXT
   - seguimiento_requerido BOOLEAN NOT NULL DEFAULT false
   - created_at / updated_at
   - UNIQUE (evaluacion_id, nnya_id)
   - ÍNDICE: (nnya_id)

8. propuestas_mejora
   - id UUID PK DEFAULT gen_random_uuid()
   - evaluacion_id UUID NOT NULL → evaluacion_institucional(id) ON DELETE CASCADE
   - descripcion TEXT NOT NULL
   - tipo TEXT NOT NULL DEFAULT 'mejora' CHECK IN ('mejora','capacitacion')
   - area TEXT CHECK IN ('educativa','sanitaria','social','institucional','protocolos')
   - responsable_id UUID → usuarios(id)
   - fecha_vencimiento DATE
   - estado TEXT NOT NULL DEFAULT 'abierto'
     CHECK IN ('abierto','en_progreso','completado','cancelado')
   - observaciones TEXT
   - created_at / updated_at
   - ÍNDICES: (estado), (responsable_id), (fecha_vencimiento)
   RAZÓN de `tipo`: el proceso 1.8 produce "propuestas de mejora" y
   "planificación de capacitaciones" en la misma reunión.

--- BLOQUE 3: Acompañamiento diario (Proceso 1.3) ---

9. turnos_personal (cobertura de turno y traspaso de jornada)
   - id UUID PK DEFAULT gen_random_uuid()
   - usuario_id UUID NOT NULL → usuarios(id)
   - fecha DATE NOT NULL
   - turno TEXT NOT NULL CHECK IN ('mañana','tarde','noche')
   - hora_inicio TIMESTAMPTZ
   - hora_cierre TIMESTAMPTZ
   - estado TEXT NOT NULL DEFAULT 'planificado'
     CHECK IN ('planificado','en_curso','entregado','cerrado','no_cubierto')
   - novedades_traspaso TEXT
   - entregado_por UUID → usuarios(id)     -- firma el saliente
   - entregado_at TIMESTAMPTZ
   - recibido_por UUID → usuarios(id)      -- firma el entrante
   - recibido_at TIMESTAMPTZ
   - created_at / updated_at
   - UNIQUE (usuario_id, fecha, turno)
   - ÍNDICES: (fecha, turno), (estado)
   - CHECK: hora_cierre IS NULL OR hora_cierre > hora_inicio

   FIRMA DOBLE (regla confirmada): el traspaso lo firman los dos.
   - El saliente cierra: setea entregado_por + entregado_at + novedades
     → estado pasa a 'entregado'
   - El entrante confirma: setea recibido_por + recibido_at
     → estado pasa a 'cerrado'
   - CHECK: estado='cerrado' → entregado_at IS NOT NULL
                               AND recibido_at IS NOT NULL
   - CHECK: recibido_at IS NULL OR recibido_at >= entregado_at
   - CHECK: entregado_por IS NULL OR entregado_por = usuario_id
     (el saliente es el titular del turno)
   - CHECK: recibido_por IS NULL OR recibido_por <> usuario_id
     (nadie se recibe a sí mismo el traspaso)

   ALCANCE: esto NO es RRHH. Deliberadamente sin horas_trabajadas,
   horas_extra, motivo_ausencia ni ausentismo — ningún proceso los pide.
   'no_cubierto' existe para detectar un turno sin personal (riesgo
   operativo), no para liquidar sueldos.

   Las observaciones sobre un NNyA puntual van en la entidad de
   seguimiento diario existente, no en novedades_traspaso.

--- BLOQUE 4: Egreso (Proceso 1.5) ---

10. seguimiento_post_egreso
   - id UUID PK DEFAULT gen_random_uuid()
   - nnya_id UUID NOT NULL → nnya(id)
   - vinculo_id UUID → vinculos_tutela(id)  -- con qué referente egresó
   - dias_post_egreso INT NOT NULL CHECK (dias_post_egreso IN (30, 60))
   - fecha_programada DATE NOT NULL   -- nnya.fecha_egreso + dias (Prompt A0)
   - fecha_contacto TIMESTAMPTZ
   - contacto_realizado BOOLEAN NOT NULL DEFAULT false
   - contacto_efectivo BOOLEAN        -- se logró hablar, o no respondió

   -- Verificación de cumplimiento (regla relevada)
   - escolaridad TEXT CHECK IN ('cumple','parcial','no_cumple','no_corresponde')
   - salud TEXT       CHECK IN ('cumple','parcial','no_cumple','no_corresponde')
   - terapias TEXT    CHECK IN ('cumple','parcial','no_cumple','no_corresponde')
   - percibe_auh BOOLEAN              -- la transferencia funciona
   - detalle_incumplimiento TEXT

   - observaciones TEXT
   - indicador_reinsercion INT CHECK (indicador_reinsercion BETWEEN 1 AND 5)
   - requiere_intervencion BOOLEAN NOT NULL DEFAULT false
   - contactado_por UUID → usuarios(id)
   - created_at / updated_at
   - UNIQUE (nnya_id, dias_post_egreso)
   - ÍNDICES: (fecha_programada), (contacto_realizado), (requiere_intervencion)

   SOLO 30 y 60 días, como dice literal el proceso 1.5. Sin 90.

   Las tres dimensiones (escolaridad, salud, terapias) salen del
   relevamiento: el seguimiento verifica que el tutor cumpla con esas
   obligaciones. 'no_corresponde' cubre al egresado que ya terminó el
   secundario o no tiene tratamiento indicado — no es lo mismo que
   'no_cumple' y no debe contar como incumplimiento en los reportes.

   `requiere_intervencion` es la salida accionable: si algo no se cumple,
   alguien tiene que hacer algo. Sin ese flag el seguimiento es un
   registro pasivo.

REQUISITOS TRANSVERSALES:
- Todas: ENABLE ROW LEVEL SECURITY (policies en A2)
- Todas: trigger de updated_at si el proyecto tiene esa función
- Todas: audit trigger con el patrón trg_audit_* exacto de las 17 tablas
  (Proceso 1.7 exige trazabilidad)
- Sin datos semilla en esta migración

VALIDACIÓN:
- list_tables → aparecen las 10 nuevas
- Cada una con rowsecurity = true y su audit trigger
- INSERT de prueba como Admin → fila en audit_log
- Intentar 2 vínculos 'vigente' para el mismo nnya → rechazado
- Intentar vinculo con usuario_id Y referente_id → rechazado
- Intentar turno 'cerrado' sin las dos firmas → rechazado
- Las 17 tablas existentes intactas

ARCHIVO:
- supabase/migrations/<timestamp>_create_tutela_evaluacion_turnos_seguimiento.sql

Escribí el plan completo y avisame antes de implementar. Incluí:
(a) cómo cifra el proyecto los DNI y cómo lo aplicaste a referentes
(b) cualquier convención donde mi propuesta chocó con el proyecto
(c) si el índice único parcial de vinculos_tutela entra en conflicto
    con algún dato o supuesto existente
```

---

## PROMPT A2: RLS Policies

```
CONTEXTO:
- Las 10 tablas nuevas existen con RLS habilitado (Prompt A1)
- Roles reales: 'Admin' / 'Equipo Tecnico'
- Rol vía get_my_role() (SECURITY DEFINER + SET row_security = off)
- NUNCA auth.jwt() ->> 'role' — devuelve siempre 'authenticated'
- Acceso amplio: Equipo Tecnico ve todas las filas
- auth.uid() devuelve auth.users.id, NO usuarios.id. Resolver siempre:
    (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  Nunca comparar responsable_id = auth.uid() directo.

ANTES DE ESCRIBIR EL PLAN:
- Copiá el patrón de policies de una tabla comparable (ej. intervenciones)
  para mantener naming y estructura.

MATRIZ:

| tabla                               | SELECT | INSERT | UPDATE          | DELETE |
|-------------------------------------|--------|--------|-----------------|--------|
| referentes                          | ambos  | ambos  | ambos           | nadie  |
| vinculos_tutela                     | ambos  | Admin  | Admin           | nadie  |
| validaciones_renaper                | ambos  | ambos  | nadie           | nadie  |
| transferencia_auh                   | ambos  | Admin  | Admin           | nadie  |
| evaluacion_institucional            | ambos  | Admin  | Admin           | nadie  |
| evaluacion_institucional_asistentes | ambos  | Admin  | ambos           | Admin  |
| evaluacion_institucional_casos      | ambos  | ambos  | ambos           | nadie  |
| propuestas_mejora                   | ambos  | Admin  | ver excepción 1 | nadie  |
| turnos_personal                     | ambos  | Admin  | ver excepción 2 | nadie  |
| seguimiento_post_egreso             | ambos  | ambos  | ver excepción 3 | nadie  |

DECISIONES DE LA MATRIZ, explicadas:

- vinculos_tutela solo Admin: cambiar quién tiene la tutela de un NNyA
  es un acto con respaldo de resolución. No es edición operativa.

- validaciones_renaper es INSERT-only: nadie puede editar ni borrar el
  resultado de una validación. Un resultado equivocado se corrige
  haciendo una validación nueva con momento='reintento'. Esto es lo que
  hace que la tabla sirva como evidencia.

- referentes editable por ambos: corregir un teléfono o un domicilio es
  operativo. El DNI en cambio no debería cambiarse nunca — si el proyecto
  soporta column-level security, restringí `dni` a Admin; si no, dejá
  nota en el plan y lo resolvemos con un trigger que rechace el UPDATE
  de esa columna.

- turnos_personal INSERT solo Admin: la grilla de turnos la arma quien
  planifica. El equipo opera sobre turnos ya creados.

EXCEPCIÓN 1 — propuestas_mejora UPDATE:
  USING (
    get_my_role() = 'Admin'
    OR responsable_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  )

EXCEPCIÓN 2 — turnos_personal UPDATE (firma doble):
El titular abre/cierra y entrega su turno; el entrante firma la recepción.
  USING (
    get_my_role() = 'Admin'
    OR usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR recibido_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR (estado = 'entregado' AND recibido_por IS NULL)
  )
La última condición permite al entrante firmar un traspaso que todavía
no tiene receptor asignado. Los CHECK de A1 impiden que se auto-firme.

EXCEPCIÓN 3 — seguimiento_post_egreso UPDATE:
  USING (
    get_my_role() = 'Admin'
    OR contactado_por IS NULL
    OR contactado_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  )

Si algún subquery sobre `usuarios` genera recursión de policies, usá el
mismo patrón SECURITY DEFINER de get_my_role() y decímelo en el plan.

VALIDACIÓN (con ambos roles):
- Admin: SELECT en las 10 → OK
- Equipo Tecnico: SELECT en las 10 → ve todas las filas
- Equipo Tecnico: INSERT en vinculos_tutela → rechazado
- Equipo Tecnico: INSERT en referentes → OK
- Cualquiera: UPDATE en validaciones_renaper → rechazado
- Cualquiera: DELETE en validaciones_renaper → rechazado
- Equipo Tecnico: entregar su propio turno → OK
- Equipo Tecnico: firmar recepción de un turno ajeno 'entregado' → OK
- Equipo Tecnico: entregar turno de otro → rechazado
- Equipo Tecnico: UPDATE propuesta asignada a él → OK
- Equipo Tecnico: UPDATE propuesta ajena → rechazado
- get_my_role() sin recursión

ARCHIVO:
- supabase/migrations/<timestamp>_rls_tutela_evaluacion_turnos_seguimiento.sql

Escribí el plan y avisame antes de implementar.
```

---

## Orden de ejecución

```
A0  → columna nnya.fecha_egreso + backfill   (1-2h)
A1  → 10 tablas nuevas                        (3-4h)
A2  → RLS policies                            (2-3h)
```

A0 va primero porque `seguimiento_post_egreso.fecha_programada` depende
de `nnya.fecha_egreso`, y el backfill puede sacar a la luz datos
inconsistentes que conviene resolver antes de construir encima.

## Puntos abiertos

1. **Cifrado de `referentes.dni`** — depende de cómo lo haga `nnya.dni`.
   Claude Code lo resuelve leyendo el esquema; si la unicidad del DNI no
   es posible sobre un campo cifrado, hay que decidir alternativa.
2. **RENAPER: credenciales y comportamiento ante rechazo.** El esquema
   ya soporta las tres respuestas (aprobado / rechazado / no_concluyente),
   pero falta definir qué hace la UI: ¿bloquea el alta del referente,
   avisa y deja seguir, o deja el vínculo en estado 'propuesto' hasta
   validación manual? Eso se decide en el prompt de UI, no en A1.
3. **Revinculación fallida.** El esquema permite volver de
   'revinculacion_familiar' a 'tutela_residencia' (se revoca el vínculo y
   se abre uno nuevo), pero no registra por qué falló más allá de
   `motivo_finalizacion`. Si el reingreso es un caso frecuente, conviene
   modelarlo mejor.
