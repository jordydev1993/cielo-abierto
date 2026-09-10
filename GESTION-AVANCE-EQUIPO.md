# Gestión de avance del equipo

Controlador de avance del proyecto Argüello Infancias (web + mobile + modelo de datos + ISO 12207 + entregas), para que los 4 integrantes vean y actualicen su progreso en tiempo real.

**Tablero:** https://github.com/users/jordydev1993/projects/1 (GitHub Projects — `jordydev1993`)

> Este archivo está también en el repo mobile (`arguello-infancias-mobile`). Es el mismo contenido: el controlador es uno solo y cubre los dos repos.

---

## Quiénes

| Persona | GitHub | Rol | Filtra su trabajo con |
|---|---|---|---|
| Jordy | `jordydev1993` | Producto / desarrollo / decisiones de arquitectura y seguridad | `Responsable = Jordy` |
| Meli | `melanilozano2015-gif` | QA / testing | `Responsable = Meli` |
| Cami | `Camigalvan` | UI/UX | `Responsable = Cami` |
| Sofi | `sofiimartineez13-debug` | Base de datos + análisis funcional | `Responsable = Sofi` |

---

## Cómo se usa

1. **Aceptá la invitación al Project** que te llega por mail (o en https://github.com/notifications), y entrá al tablero con el link de arriba.
2. **Vista "Por responsable"** (la que abre por defecto): están las 4 personas, y dentro de cada una sus tarjetas ordenadas por estado. El avance de cada quien se lee ahí: *tarjetas en `Hecha` / total*.
3. **Actualizá solo tus tarjetas.** Cada uno mueve las suyas de estado a medida que avanza. Sos colaborador/a del Project (no de los repos): editás los campos de las tarjetas, no el código.
4. Si una tarjeta te frena, ponela en `Bloqueada` y escribí en el campo **Nota** qué falta o de quién depende.

### Estados

| Estado | Qué significa |
|---|---|
| `Sin empezar` | Todavía no la tocaste |
| `En curso` | La estás haciendo esta semana |
| `Bloqueada` | No podés avanzar hasta que se resuelva algo (anotarlo en **Nota**) |
| `En revisión` | Terminada, esperando que alguien la valide / apruebe |
| `Hecha` | Terminada y validada. (Cerrar el issue de GitHub es opcional — lo hace Jordy en la revisión semanal.) |

### Campos

- **Responsable** — quién la hace (no uses el "Assignees" de GitHub, usá este campo).
- **Área** — `Modelo de datos` · `App mobile` · `App web` · `ISO 12207` · `Entregas`. La vista "Por frente" agrupa por acá.
- **Estado** — ver tabla de arriba.
- **Prioridad** — `Alta` / `Media` / `Baja`.
- **Nota** — una línea: el bloqueo, el próximo paso, o el link a lo que estás por entregar.

---

## Vistas

- **Por responsable** — avance de cada persona. La principal.
- **Por frente** — agrupa por Área; sirve para ver cómo viene cada parte del proyecto.
- **Tabla** — todo junto, filtrable y ordenable (útil para la revisión semanal).

---

## Revisión semanal

Lunes, 10 minutos, sobre la vista **Tabla**:
- Cada uno pasa sus `En curso` y `Bloqueada`.
- Se destraban los bloqueos (o se reasigna el `Responsable` a quien corresponda).
- Jordy cierra los issues de las tarjetas que quedaron en `Hecha`.
- Se agregan tarjetas nuevas que hayan aparecido (Jordy crea el issue con el label `area:*` y lo suma al Project; el resto puede pedirlo por la **Nota** de una tarjeta o en el grupo).

---

## Frente web (este repo)

Las tarjetas de `Area = App web` son issues de este repo (`cielo-abierto`). Salen de `docs/evolucion/CHECKLIST-FINAL (1).md` y de la deuda técnica detectada en la auditoría:

- **FASES B–E** — las 10 tablas nuevas (`vinculos_tutela`, `evaluacion_institucional*`, `turnos_personal`, `seguimiento_post_egreso`, etc.) están creadas con RLS pero sin UI.
- **Audit log** — hoy no hay ningún trigger `trg_audit_*` ni la función `fn_audit_trigger()`; `audit_log` tiene 0 filas pese a que la doc dice "auditoría inmutable en cada acción".
- **Rol rot** — 6 de 7 seed users apuntan a roles legacy y sin `auth_user_id`: si se les da login se lockean de las 27 tablas.
- **DNI** — `AGENTS`/arquitectura afirman cifrado AES-256; `nnya.dni` y `tutores.dni` son `varchar` plano.
- **`types/database.types.ts`** — a mano, debería generarse con `supabase gen types`.
- **Tests** — Playwright instalado, 0 tests.

---

## Notas

- Las tarjetas son **issues de GitHub** en los repos `arguello-infancias-mobile` (mobile, modelo de datos, ISO, entregas) y `cielo-abierto` (web). El Project las junta a todas.
- El cuerpo de cada issue apunta al archivo o carpeta del repo donde está el contexto completo.
- Las 4 decisiones del modelo de datos (`tipo:decision`) son lo que destraba la conexión de mobile a Supabase — tienen prioridad `Alta`.
