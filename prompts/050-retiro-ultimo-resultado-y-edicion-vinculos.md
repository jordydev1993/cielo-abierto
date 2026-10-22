# 050 — Último resultado de Didit al abrir un retiro, y edición de vínculos solo para Admin

> **Estado: PLAN, pendiente de aprobación (22/10).** Dos mejoras chicas que salieron de la QA de la innovación 1 (`QA-DIDIT-RETIRO.md`, 21/10).

## Objetivo

1. Cuando se abre un retiro que ya tiene sesiones de Didit, mostrar el resultado de la última, sin tener que iniciar otra verificación.
2. No mostrarle a Equipo Tecnico el lápiz para editar vínculos de tutela, porque la base no lo deja guardar.

Cubre **REQ-EGR-04** y **REQ-EGR-01** (`specs/10-egreso-y-tutela.md`).

## Contexto

- **Problema 1.** `VerificacionDidit` guarda la sesión en su estado interno. Si se recarga la página, el retiro ya no muestra el resultado de su última sesión (por ejemplo "El DNI verificado no coincide…") hasta que se toca "Iniciar verificación". La API sí lo devuelve: `GET /api/didit/sesiones/[id]` (Plan 047).
- **Problema 2.** `TutelaTab` le pasa `onEdit` a `VinculoTutelaList` a cualquier rol. Pero la política `vinculos_tutela_update_admin` solo deja actualizar a Admin, así que a Equipo Tecnico el guardado le falla. "Nuevo vínculo" ya está detrás de `AccessGuard` para Admin.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `components/entities/retiros/VerificacionDidit.tsx` | Prop opcional `sesionInicialId`. Con ella, al montar, consulta el estado de esa sesión y muestra el badge, los intentos y el mensaje de D-33. Si la sesión sigue pendiente, en lugar del QR muestra "Hay una verificación en curso" y el botón "Continuar verificación", que retoma la sesión abierta (decisión 3 del Plan 047) |
| `components/entities/retiros/RetiroEnCurso.tsx` | Le pasa a `VerificacionDidit` el id de la última sesión del retiro |
| `components/legajos/tabs/TutelaTab.tsx` | `onEdit` solo si el rol es Admin (`useAuth`), igual que "Nuevo vínculo" |

## Requisitos

1. **El mensaje sale de la API**, como hasta ahora. La pantalla no arma textos propios para los estados de D-33.
2. **No se crea ninguna sesión al abrir el retiro.** Solo se consulta.
3. **Con un resultado final que permite reintentar** (`IDENTITY_NOT_VERIFIED`, `DNI_MISMATCH`, `PROVIDER_ERROR`) y con intentos restantes, se ofrece "Reintentar verificación". Es la misma regla que ya existe.
4. **Equipo Tecnico** sigue viendo la lista de vínculos, pero sin el lápiz.

## Seguridad

No cambia nada en la base. La garantía sigue siendo RLS y los triggers; esto solo evita mostrar acciones que la base va a rechazar.

## Criterios de aceptación

- Al recargar `/retiros` y abrir un retiro con una sesión `DNI_MISMATCH`, se ve el badge "Identidad no verificada", el mensaje de D-33, los intentos y "Reintentar verificación".
- Al abrir un retiro con una sesión pendiente, se ve "Continuar verificación", y al tocarlo aparece el QR de la misma sesión, sin crear otra.
- Como Equipo Tecnico, la pestaña Tutela no muestra el lápiz. Como Admin, sí.
- `npm run test:unit`, `npm run lint` (sin errores nuevos), `npx tsc --noEmit` y `npm run build` en verde.

## Verificación manual

En el navegador, contra Supabase local, con los usuarios de prueba Admin y Equipo Tecnico y los retiros que quedaron de la QA del 21/10.
