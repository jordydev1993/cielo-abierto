# 024 — Reemplazar el README boilerplate

**Tarjeta:** [#12](https://github.com/jordydev1993/cielo-abierto/issues/12) — Jordy — Baja

## Objetivo

`README.md` seguía siendo el boilerplate de `create-next-app`. Reemplazarlo por contenido
real del proyecto.

## Archivos inspeccionados

- `README.md` (estado previo: boilerplate sin tocar)
- `package.json` (scripts reales: `dev`, `build`, `start`, `lint`)
- Grep de `process\.env\.[A-Z_]+` sobre todo `*.{ts,tsx}` — únicas 4 variables reales
  usadas en el código: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (`app/api/usuarios/route.ts`, server-only),
  `DIDIT_WEBHOOK_SECRET` (`app/api/didit/webhook/route.ts`, server-only)
- `next.config.ts` (`allowedDevOrigins: ['127.0.0.1']` — ya soluciona el problema de
  `prompts/008`, no es un gotcha activo)

## Requisitos

- No inventar variables de entorno ni pasos que no estén confirmados en el código.
- `AGENTS-WEB.md` como fuente de verdad del resto (arquitectura, modelo de datos, roles,
  seguridad) — el README no la duplica, apunta a ella.

## Archivos modificados

- `README.md`: reescrito completo — qué es el proyecto, stack, requisitos, cómo levantar
  el entorno local, tabla de variables de entorno (con dónde se usa cada una), scripts,
  y un resumen de estructura de carpetas.
- `AGENTS-WEB.md` § Arquitectura: el diagrama de árbol decía
  `types/database.types.ts   tipos de dominio escritos a mano (NO generados con
  supabase gen types)` — desactualizado desde `prompts/020` (issue #8). Corregido para
  reflejar `database.generated.ts` + `database.types.ts` derivado.
- `AGENTS-WEB.md` § Deuda conocida: ítem `readme` movido a "Resuelto".

## Primer borrador incorrecto, corregido antes de terminar

La primera versión del README decía que acceder por `127.0.0.1` en dev **no hidrata**
— citando de memoria el problema original de `prompts/008`. Al verificar `next.config.ts`
antes de dar el archivo por terminado, encontré que ese mismo prompt ya agregó
`allowedDevOrigins: ['127.0.0.1']`, que soluciona exactamente ese problema. La nota estaba
describiendo un bug ya resuelto como si siguiera activo. Corregido para decir lo contrario:
ambos orígenes (`localhost`/`127.0.0.1`) funcionan hoy.

## Criterios de aceptación

- `README.md` no contiene ningún texto de `create-next-app`.
- Las 4 variables de entorno documentadas coinciden exactamente con las que usa el código.

## Chequeos

- No aplica `lint`/`build`/`tsc` — cambio de documentación puro, sin código.

---

**Estado**: implementado.
