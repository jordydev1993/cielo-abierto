# Tareas pendientes — App Web (`cielo-abierto`)

**Fecha:** 2026-09-15 (actualizado tras la sesión del 2026-09-15 — ver "Completadas")
**Fuente:** tablero del equipo (https://github.com/users/jordydev1993/projects/1), área
"App web", consultado en vivo vía `gh project item-list`.
**Repo:** `cielo-abierto`.

---

## ✅ Completadas en esta sesión (10) — todas las de Jordy

| # | Qué era | Prompt | Nota |
|---|---|---|---|
| [#3](https://github.com/jordydev1993/cielo-abierto/issues/3) | Rol rot: 6 seed users con roles legacy y sin `auth_user_id` | `prompts/017` | Eran datos de prueba — borrados. Solo quedan `Admin`/`Equipo Tecnico` y el usuario real. |
| [#2](https://github.com/jordydev1993/cielo-abierto/issues/2) | Audit log real (`fn_audit_trigger()` + `trg_audit_*`) | `prompts/018` | Resuelta la decisión A/B/C de `prompts/012` (Opción C: las 27 tablas). |
| [#4](https://github.com/jordydev1993/cielo-abierto/issues/4) | FASE B — UI tutela/referentes + validación RENAPER + transferencia AUH | `prompts/019` | Módulo `/referentes` + tab "Tutela" en Legajo. De paso corrigió 2 bugs reales (`DialogContent` sin scroll, embed ambiguo en Supabase). |
| [#8](https://github.com/jordydev1993/cielo-abierto/issues/8) | Generar `types/database.types.ts` con `supabase gen types` | `prompts/020` | Encontró drift real: `legajo_id` era nullable sin necesidad en 7 tablas — corregido con `NOT NULL` (`prompts/020`, migración `20260915193141`). |
| [#11](https://github.com/jordydev1993/cielo-abierto/issues/11) | DNI: cifrado real o corregir la doc | `prompts/021` | Decisión: corregir la doc, no cifrar (cifrar rompería `UNIQUE(dni)` y la búsqueda sin ganancia real de seguridad). |
| [#5](https://github.com/jordydev1993/cielo-abierto/issues/5) | FASE C — UI evaluación institucional + kanban de propuestas + notificaciones | `prompts/022` | Módulo `/evaluacion-institucional` + `/propuestas-mejora` (kanban con botones, sin drag-and-drop). Notificaciones = badge in-app, mismo patrón que Alertas. |
| [#6](https://github.com/jordydev1993/cielo-abierto/issues/6) | FASE D — UI `turnos_personal` + firma doble de traspaso + dashboard cobertura | `prompts/023` | "Entregar"/"Recibir" separados en 2 acciones ligadas a la identidad del usuario logueado (RLS sola no alcanza a garantizar la firma doble). Encontró y corrigió un bug real: el form de edición no podía guardar un turno ya `entregado`. |
| [#12](https://github.com/jordydev1993/cielo-abierto/issues/12) | Reemplazar el `README.md` boilerplate | `prompts/024` | Reescrito con stack, setup, variables de entorno reales (confirmadas por grep, no inventadas) y estructura. |
| [#16](https://github.com/jordydev1993/cielo-abierto/issues/16) | `ON DELETE CASCADE` en `nnya_id` | `prompts/025` | El alcance real era 14 tablas, no solo `novedades`/`incidentes`. Las 14 pasaron a `RESTRICT` (mismo patrón que `legajos`). `SET NULL` no era viable (`nnya_id` es `NOT NULL` en todas) y hubiera destruido la auditoría que la tarjeta quiere proteger. |
| [#7](https://github.com/jordydev1993/cielo-abierto/issues/7) | FASE E — UI seguimiento post-egreso + generación 30/60 días + dashboard reinserción | `prompts/026` | Encontró un bug bloqueante: no se podía marcar "Egresado" sin romper un `CHECK` (faltaba `fecha_egreso` en el form de NNyA) — corregido. El "cron" se resolvió con un trigger de BD al momento del egreso, sin infraestructura nueva. |

Detalle completo de cada una en `AGENTS-WEB.md` § Deuda conocida → Resuelto, y en el
`prompts/NNN-*.md` correspondiente.

**Extra no pedido, surgido de feedback directo (sin tarjeta):** confusión Ver/Editar en
`/legajos` corregida (`LegajoTable` ahora sigue el mismo patrón que NNyA), y "Editar
legajo" pasó de página aparte a diálogo inline sobre la vista con tabs.

---

## 2 tarjetas pendientes (ninguna de Jordy)

| # | Persona | Qué es | Estado | Prioridad |
|---|---|---|---|---|
| [#9](https://github.com/jordydev1993/cielo-abierto/issues/9) | Meli | Tests automatizados web (Playwright instalado, 0 tests escritos) | Sin empezar | Media |
| [#10](https://github.com/jordydev1993/cielo-abierto/issues/10) | Cami | Design system web: escala tipográfica, `Toaster` warning/info, wrapper `alert-dialog`, colores hardcodeados en `NnyaTable` | Sin empezar | Baja |

## Entregables esperados por tarjeta

### [#9](https://github.com/jordydev1993/cielo-abierto/issues/9) — Tests (Meli)

- Primer set de tests Playwright (hoy 0 escritos) cubriendo al menos: login, un flujo CRUD
  completo de una entidad (alta → edición → verificación en lista), y un caso de
  autorización por rol (Equipo Tecnico sin acceso a `/usuarios`).
- Config mínima de CI si no existe (`playwright.config.ts` ya debería estar, confirmar).

### [#10](https://github.com/jordydev1993/cielo-abierto/issues/10) — Design system (Cami)

- Escala tipográfica nombrada en `docs/design-system.md` § 5 (hoy sin nombrar).
- Variantes `warning`/`info` en `Toaster` (hoy solo `success`/`destructive`, ver
  `components/ui/toaster.tsx`).
- Wrapper de alert-dialog no destructivo (hoy `ConfirmDialog` está pensado para acciones
  destructivas).
- Reemplazo de colores hardcodeados en `NnyaTable.tsx` por tokens `@theme`.

## Resumen por persona

| Persona | Pendientes |
|---|---|
| Jordy | 0 |
| Meli | 1 |
| Cami | 1 |
| Sofi | 0 |

## Plantilla de pedido

```
Contexto: soy <tu nombre>, tarjeta #<N> del tablero (<pegá el título>).
Repo: cielo-abierto

Pedido: Leé AGENTS-WEB.md + la skill que corresponda, inspeccioná <archivo o carpeta
relacionado>, y escribime un PLAN en prompts/NNN-slug.md para <qué querés lograr,
en una frase>.

No implementes todavía — quiero revisar el plan primero.
```
