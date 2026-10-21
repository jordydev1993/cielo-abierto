# 039 — RLS: `auth.uid()` evaluado una vez por consulta

**Tarjeta:** sin tarjeta (pendiente del panel: "Rendimiento (linter)") — Jordy — Baja
**Estado:** borrador, esperando aprobación de Jordy.

## Objetivo

Resolver el advisor 0003 (`auth_rls_initplan`): 4 políticas llaman a `auth.uid()` directamente, y Postgres la reevalúa por cada fila. Envuelta en `(SELECT auth.uid())`, se evalúa una sola vez por consulta (initplan). Sin cambiar qué puede hacer cada rol.

## Contexto

Verificado en producción el 10/10/2026 (solo lectura, `pg_policies` y `get_advisors`). Las 4 políticas son `PERMISSIVE`, `TO authenticated`:

| Tabla | Política | Comando |
|-------|----------|---------|
| `usuarios` | `usuarios_self_read` | SELECT |
| `propuestas_mejora` | `propuestas_mejora_update_admin_o_responsable` | UPDATE |
| `turnos_personal` | `turnos_personal_update_firma` | UPDATE |
| `seguimiento_post_egreso` | `seguimiento_post_egreso_update_admin_o_contactado` | UPDATE |

Con el volumen actual (decenas de filas) el impacto es imperceptible; es una mejora de higiene que evita un problema al crecer.

## Cambio propuesto

Migración `20261011000000_rls_select_auth_uid.sql` con `ALTER POLICY ... USING (...) WITH CHECK (...)` para las 4 políticas:

- `auth.uid()` → `(SELECT auth.uid())`;
- `get_my_role()` → `(SELECT get_my_role())`, por el mismo motivo (el advisor no la detecta porque no es de `auth`, pero también se evalúa por fila);
- el resto de cada expresión, idéntico al vigente.

`ALTER POLICY` en lugar de `DROP` + `CREATE`: la tabla nunca queda sin política.

## Supuestos

1. `get_my_role()` es estable dentro de una consulta (lee el rol del usuario de la sesión), así que evaluarla una vez da el mismo resultado.

## Fuera de alcance

- Advisor 0006 (`multiple_permissive_policies` en `roles` y `usuarios`) y 0001/0005 (índices en FKs e índices sin uso): nivel INFO o de diseño, para otro plan si hace falta.

## Criterios de aceptación

1. `pg_policies` muestra las 4 políticas con `( SELECT auth.uid() AS uid)` y el resto de la lógica igual.
2. `get_advisors` de rendimiento: desaparece el aviso 0003.
3. En la app: un usuario ve su propio registro en `usuarios`; un responsable puede actualizar su propuesta; la firma doble del traspaso de turno funciona (entrega y recepción); un usuario puede registrar el contacto de un seguimiento post-egreso.

## Verificación

- Criterios 1 y 2: consultas de solo lectura después de aplicar.
- Criterio 3: en la app desplegada, con un usuario `Equipo Tecnico`.
- No hay cambios de código: no aplica lint ni build.
