# 013 — Políticas RLS para las 10 tablas de FASE A1 (FASE A2)

## Objetivo

Cerrar el gap dejado a propósito en A1 (`prompts/012-...md`): las 10 tablas de tutela,
evaluación institucional, turnos de personal y seguimiento post-egreso tienen RLS
**habilitado pero sin políticas**, por lo que hoy son inaccesibles vía la app incluso para
Admin. Esta migración agrega las políticas SELECT/INSERT/UPDATE/DELETE por tabla según la
matriz que diste, más la protección del campo `dni` en `referentes`.

## Contexto — patrón copiado y verificado

Se leyó de nuevo `20260620000031_clean_schema.sql` para copiar el patrón exacto de una
tabla comparable (`intervenciones`):

```sql
CREATE POLICY "intervenciones_admin_tecnico_all" ON intervenciones
  FOR ALL TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));
```

Esa tabla usa una sola política `FOR ALL` porque las 4 operaciones tienen la misma regla.
Acá la matriz pide reglas distintas por operación en la mayoría de las tablas, así que se
abre en políticas separadas por operación (mismo estilo que ya usan `roles`/`usuarios`:
`roles_admin_all` + `roles_select_all`, `usuarios_admin_all` + `usuarios_self_read`).
Convención de nombres usada acá: `<tabla>_<operacion>_<alcance>` (ej.
`referentes_update_admin_tecnico`, `propuestas_mejora_update_admin_o_responsable`). Para
`nadie` en una operación, simplemente no se crea política — con RLS habilitado y sin match,
Postgres deniega por default; no hace falta una política que siempre sea `false`.

## Verificado antes de escribir el plan

1. **`get_my_role()` real** (`pg_get_functiondef` + `pg_proc`/`pg_class`):
   ```sql
   CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT
   LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
   AS $$ SELECT CASE r.nombre WHEN 'Direccion' THEN 'Admin' ELSE r.nombre END
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     WHERE u.auth_user_id = auth.uid() AND u.activo = TRUE LIMIT 1; $$;
   ```
   **No tiene `SET row_security = off`** (a diferencia de lo que decía tu contexto) — y no
   lo necesita: el dueño de la función y el dueño de `usuarios` son ambos `postgres`,
   `usuarios` no tiene `FORCE ROW LEVEL SECURITY`, y por ser `SECURITY DEFINER` la consulta
   interna corre como el dueño de la tabla → Postgres bypassea RLS automáticamente para el
   dueño. Es una imprecisión menor de tu nota, no algo para corregir (ya funciona
   correctamente, solo por un mecanismo distinto al que describías).

2. **Recursión en los subqueries nuevos** (`(SELECT id FROM usuarios WHERE auth_user_id =
   auth.uid())`, usados en las 3 excepciones): **no hace falta el patrón SECURITY DEFINER**.
   Estos subqueries corren como `authenticated` (no como el dueño), así que sí están sujetos
   a las políticas RLS de `usuarios` — pero la política `usuarios_self_read` (`FOR SELECT
   USING (auth_user_id = auth.uid())`, ya existente) permite exactamente esa fila: cualquier
   usuario autenticado puede leer su propia fila en `usuarios`. Como el subquery siempre
   filtra por `auth.uid()` (la propia sesión), nunca necesita ver la fila de otro usuario, y
   la política `self_read` ya cubre el caso sin tocar nada. No hay recursión: no vuelve a
   llamar a `get_my_role()` ni a políticas de otras tablas.

3. **`dni` de `referentes` — ¿column-level security?** Verificado: el proyecto no usa
   privilegios a nivel de columna en ninguna migración (no hay `GRANT`/`REVOKE ... (columna)`
   en las 33 migraciones); los permisos de tabla vienen del rol `authenticated` por default
   de Supabase, y todo el control de acceso pasa por RLS (a nivel de fila, no de columna).
   No hay precedente para restringir una columna así. **Se aplica tu fallback**: un trigger
   `BEFORE UPDATE` que rechaza el cambio si `dni` cambia y quien ejecuta no es Admin.

## Plan de la migración

Archivo nuevo: `supabase/migrations/20260827000034_rls_tutela_evaluacion_turnos_seguimiento.sql`

```sql
-- FASE A2 (AGENTS.md sección 11): políticas RLS para las 10 tablas de A1.
-- Ver prompts/013-rls-tutela-evaluacion-turnos-seguimiento.md para el análisis completo.
-- Patrón copiado de "intervenciones_admin_tecnico_all" (clean_schema.sql), abierto en
-- políticas por operación porque la matriz pide reglas distintas por operación.

-- ============================================================
-- referentes — SELECT/INSERT/UPDATE ambos, DELETE nadie
-- dni protegido por trigger (ver más abajo), no por policy (RLS es por fila, no columna)
-- ============================================================

CREATE POLICY "referentes_select_admin_tecnico" ON referentes
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "referentes_insert_admin_tecnico" ON referentes
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "referentes_update_admin_tecnico" ON referentes
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- El DNI no se toca por operativa: solo Admin puede cambiarlo. RLS no distingue columnas,
-- así que se refuerza con un trigger (mismo patrón fn_/trg_ que fn_crear_alerta_incidente_grave).
CREATE OR REPLACE FUNCTION fn_proteger_dni_referente()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.dni IS DISTINCT FROM OLD.dni AND get_my_role() <> 'Admin' THEN
    RAISE EXCEPTION 'Solo Admin puede modificar el DNI de un referente';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_dni_referente ON referentes;
CREATE TRIGGER trg_proteger_dni_referente
  BEFORE UPDATE ON referentes
  FOR EACH ROW
  EXECUTE FUNCTION fn_proteger_dni_referente();

-- ============================================================
-- vinculos_tutela — SELECT ambos, INSERT/UPDATE Admin, DELETE nadie
-- ============================================================

CREATE POLICY "vinculos_tutela_select_admin_tecnico" ON vinculos_tutela
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "vinculos_tutela_insert_admin" ON vinculos_tutela
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "vinculos_tutela_update_admin" ON vinculos_tutela
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- ============================================================
-- validaciones_renaper — SELECT/INSERT ambos, UPDATE/DELETE nadie (evidencia inmutable)
-- ============================================================

CREATE POLICY "validaciones_renaper_select_admin_tecnico" ON validaciones_renaper
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "validaciones_renaper_insert_admin_tecnico" ON validaciones_renaper
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- ============================================================
-- transferencia_auh — SELECT ambos, INSERT/UPDATE Admin, DELETE nadie
-- ============================================================

CREATE POLICY "transferencia_auh_select_admin_tecnico" ON transferencia_auh
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "transferencia_auh_insert_admin" ON transferencia_auh
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "transferencia_auh_update_admin" ON transferencia_auh
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- ============================================================
-- evaluacion_institucional — SELECT ambos, INSERT/UPDATE Admin, DELETE nadie
-- ============================================================

CREATE POLICY "evaluacion_institucional_select_admin_tecnico" ON evaluacion_institucional
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_insert_admin" ON evaluacion_institucional
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "evaluacion_institucional_update_admin" ON evaluacion_institucional
  FOR UPDATE TO authenticated
  USING (get_my_role() = 'Admin')
  WITH CHECK (get_my_role() = 'Admin');

-- ============================================================
-- evaluacion_institucional_asistentes — SELECT ambos, INSERT/DELETE Admin, UPDATE ambos
-- ============================================================

CREATE POLICY "evaluacion_institucional_asistentes_select_admin_tecnico" ON evaluacion_institucional_asistentes
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_asistentes_insert_admin" ON evaluacion_institucional_asistentes
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "evaluacion_institucional_asistentes_update_admin_tecnico" ON evaluacion_institucional_asistentes
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_asistentes_delete_admin" ON evaluacion_institucional_asistentes
  FOR DELETE TO authenticated
  USING (get_my_role() = 'Admin');

-- ============================================================
-- evaluacion_institucional_casos — SELECT/INSERT/UPDATE ambos, DELETE nadie
-- ============================================================

CREATE POLICY "evaluacion_institucional_casos_select_admin_tecnico" ON evaluacion_institucional_casos
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_casos_insert_admin_tecnico" ON evaluacion_institucional_casos
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "evaluacion_institucional_casos_update_admin_tecnico" ON evaluacion_institucional_casos
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'))
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

-- ============================================================
-- propuestas_mejora — SELECT ambos, INSERT Admin, UPDATE Admin u responsable, DELETE nadie
-- ============================================================

CREATE POLICY "propuestas_mejora_select_admin_tecnico" ON propuestas_mejora
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "propuestas_mejora_insert_admin" ON propuestas_mejora
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "propuestas_mejora_update_admin_o_responsable" ON propuestas_mejora
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'Admin'
    OR responsable_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'Admin'
    OR responsable_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  );

-- ============================================================
-- turnos_personal — SELECT ambos, INSERT Admin, UPDATE firma doble, DELETE nadie
-- ============================================================

CREATE POLICY "turnos_personal_select_admin_tecnico" ON turnos_personal
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "turnos_personal_insert_admin" ON turnos_personal
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'Admin');

CREATE POLICY "turnos_personal_update_firma" ON turnos_personal
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'Admin'
    OR usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR recibido_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR (estado = 'entregado' AND recibido_por IS NULL)
  )
  WITH CHECK (
    get_my_role() = 'Admin'
    OR usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR recibido_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
    OR (estado = 'entregado' AND recibido_por IS NULL)
  );

-- ============================================================
-- seguimiento_post_egreso — SELECT/INSERT ambos, UPDATE Admin o contactado_por, DELETE nadie
-- ============================================================

CREATE POLICY "seguimiento_post_egreso_select_admin_tecnico" ON seguimiento_post_egreso
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "seguimiento_post_egreso_insert_admin_tecnico" ON seguimiento_post_egreso
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('Admin','Equipo Tecnico'));

CREATE POLICY "seguimiento_post_egreso_update_admin_o_contactado" ON seguimiento_post_egreso
  FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'Admin'
    OR contactado_por IS NULL
    OR contactado_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    get_my_role() = 'Admin'
    OR contactado_por IS NULL
    OR contactado_por IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid())
  );
```

## Supuestos

- **`WITH CHECK` mirror de `USING`** en las 3 excepciones (propuestas_mejora, turnos_personal,
  seguimiento_post_egreso): diste la condición `USING` pero no una `WITH CHECK` separada.
  Se replicó la misma condición para la fila resultante, igual que hace el resto del
  esquema (todas las políticas `_all` existentes usan la misma expresión en ambas
  cláusulas). Si querés que la fila resultante cumpla una condición distinta a la de
  acceso (ej. que el entrante no pueda reasignar `usuario_id` al firmar), decímelo y separo
  las cláusulas.
- **`turnos_personal_update_firma` — límite conocido, no resuelto acá**: la condición
  `usuario_id IN (self)` le permite al titular, en la misma operación de "entregar", setear
  `recibido_por` a cualquier `usuario_id` (no solo al que efectivamente lo recibe) — el
  `CHECK` de A1 impide que se ponga a sí mismo, pero no impide que invente un receptor. RLS
  a nivel de fila no puede validar "esta otra persona realmente confirmó" — eso requiere que
  la UI de FASE D solo permita al titular setear su propia mitad (`entregado_*`) y deje
  `recibido_*` para una acción separada del entrante. Se documenta, no se resuelve en SQL.
- El trigger `fn_proteger_dni_referente` solo protege `UPDATE`; no hace falta protegerlo en
  `INSERT` porque ahí no hay "cambio" posible (`OLD` no existe) y la política de INSERT ya
  exige `Admin`/`Equipo Tecnico` como cualquier alta.
- No se tocan las policies de las 17 tablas existentes.
- No se agregan triggers de auditoría (sigue pendiente la decisión de A/B/C de
  `prompts/012-...md` — no es parte de esta migración).

## Criterios de aceptación (= tu lista de validación)

- Admin: `SELECT` en las 10 tablas → OK.
- Equipo Tecnico: `SELECT` en las 10 tablas → ve todas las filas.
- Equipo Tecnico: `INSERT` en `vinculos_tutela` → rechazado.
- Equipo Tecnico: `INSERT` en `referentes` → OK.
- Cualquiera: `UPDATE` en `validaciones_renaper` → rechazado (sin política).
- Cualquiera: `DELETE` en `validaciones_renaper` → rechazado (sin política).
- Equipo Tecnico: entregar su propio turno (`entregado_por`/`entregado_at`/`estado`) → OK.
- Equipo Tecnico: firmar recepción de un turno ajeno en `estado='entregado'` con
  `recibido_por IS NULL` → OK.
- Equipo Tecnico: intentar "entregar" (setear `entregado_por`) un turno de otro usuario →
  rechazado.
- Equipo Tecnico: `UPDATE` en una propuesta con `responsable_id` = su propio id → OK.
- Equipo Tecnico: `UPDATE` en una propuesta ajena → rechazado.
- `get_my_role()` sin recursión (ya verificado arriba por diseño — `SECURITY DEFINER` +
  mismo dueño que `usuarios`).
- Extra (no estaba en tu lista, pero se desprende de la matriz): `UPDATE` de `dni` en
  `referentes` por Equipo Tecnico → rechazado por el trigger; por Admin → OK.

## Chequeos

- Aplicar la migración contra el proyecto conectado.
- Correr cada validación de la lista de arriba (usando el usuario Admin y un usuario
  Equipo Tecnico reales de los datos semilla, vía `SET request.jwt.claims`/`SET ROLE`
  simulando cada sesión, o con las credenciales reales desde la app si es más simple).
- Confirmar que las 17 tablas viejas y sus políticas no cambiaron
  (`SELECT COUNT(*) FROM pg_policies WHERE schemaname='public'` antes/después, descontando
  las nuevas).

## Verificación manual

- Con un usuario Equipo Tecnico real: loguearse y confirmar que ahora puede ver/crear
  referentes desde donde exponga la UI (si ya existe; si no, verificación por SQL directo
  simulando el rol).

---

**Estado**: implementado y verificado contra la base real (`rls_tutela_evaluacion_turnos_seguimiento` aplicada vía Supabase).

## Verificación post-implementación

Todas las políticas y el trigger de `dni` se aplicaron sin errores. Corrí los 13 casos de
la lista de validación con datos reales, dentro de una transacción que terminó sin `COMMIT`
(se descartó sola al cerrar la conexión — confirmado después: las 6 tablas de prueba
quedaron en 0 filas y el usuario de prueba volvió a `Admin`).

**Método**: la base semilla solo tiene **un** usuario con `auth_user_id` real vinculado
(Jordy, rol Admin) — ver hallazgo abajo. Para probar el camino "Equipo Tecnico" con una
sesión real, hice un *flip* temporal de `usuarios.rol_id` de Jordy dentro de la misma
transacción (usando el rol de conexión, que bypassea RLS, antes de impersonar
`authenticated` vía `SET LOCAL request.jwt.claims`), corrí los casos, y lo devolví a Admin
antes de terminar. Nada de esto persistió.

| Caso | Resultado |
|---|---|
| `get_my_role()` tras flip a Equipo Tecnico | `Equipo Tecnico` ✅ |
| INSERT `referentes` (Equipo Tecnico) | OK ✅ |
| INSERT `vinculos_tutela` (Equipo Tecnico) | RECHAZADO — RLS ✅ |
| UPDATE `dni` en `referentes` (Equipo Tecnico) | RECHAZADO — trigger ✅ |
| UPDATE `dni` en `referentes` (Admin) | OK ✅ |
| INSERT `validaciones_renaper` (Equipo Tecnico) | OK ✅ |
| UPDATE `validaciones_renaper` (cualquiera) | RECHAZADO — 0 filas, sin política ✅ |
| DELETE `validaciones_renaper` (cualquiera) | RECHAZADO — 0 filas, sin política ✅ |
| Entregar turno propio (Equipo Tecnico) | OK ✅ |
| Firmar recepción de turno ajeno `entregado` sin receptor (Equipo Tecnico) | OK ✅ |
| Entregar turno ajeno `planificado` (Equipo Tecnico) | RECHAZADO — 0 filas ✅ |
| UPDATE propuesta propia (`responsable_id` = self) (Equipo Tecnico) | OK ✅ |
| UPDATE propuesta ajena (Equipo Tecnico) | RECHAZADO — 0 filas ✅ |

Los 13 casos dieron el resultado esperado. `get_my_role()` no mostró ningún signo de
recursión (ni error, ni bloqueo) en ningún paso, incluidos los 2 flips de rol dentro de la
misma transacción.

### Hallazgo no esperado: 6 de los 7 usuarios semilla no tienen rol real ni login

Al buscar un usuario real con rol "Equipo Tecnico" para probar, encontré:

- La tabla `roles` tiene **7** filas, no 2: `Admin`, `Equipo Tecnico` (las 2 vigentes) más
  5 roles viejos con id `10000000-...` — `Abogado/a`, `Administrador`, `Médico/a`,
  `Psicólogo/a`, `Trabajador Social` — que ya no deberían existir según el refactor
  documentado en el git log (`f0bcccd refactor: eliminar rol Educador — Equipo Tecnico
  hereda acceso total`).
- Los 6 usuarios semilla que no son Jordy (`María`, `Carlos`, `Ana`, `Diego`, `Lucía`,
  `Sofía`) **todavía apuntan a esos roles viejos vía `rol_id`** — nunca se migraron al
  rol `Equipo Tecnico` consolidado. `get_my_role()` para cualquiera de ellos devolvería
  literalmente `'Trabajador Social'`, `'Médico/a'`, etc. — ninguno matchea
  `IN ('Admin','Equipo Tecnico')`, así que quedarían bloqueados de **todas** las tablas
  (las 17 viejas y las 10 nuevas), no solo de estas.
- Además, **ninguno de esos 6 tiene `auth_user_id`** (no pueden loguearse hoy) — por eso
  el problema está dormido: no hay ningún login real que lo dispare todavía. Pero si en
  algún momento se crea un login real para alguno de ellos sin corregir su `rol_id`
  primero, quedaría con acceso cero pese a estar `activo = true`.
- **No lo corregí** — es un problema de datos semilla, no de esta migración de RLS, y
  cambiar `rol_id` de usuarios reales no es parte de A2. Si querés, lo resuelvo en un
  prompt aparte (`UPDATE usuarios SET rol_id = <Equipo Tecnico> WHERE rol_id IN (<5 roles
  viejos>)`, más decidir si borrar esas 5 filas huérfanas de `roles`).
