# Argüello Infancias — Web

Sistema de gestión para una residencia de NNyA (niños, niñas y adolescentes) bajo
protección judicial, en Córdoba, Argentina. Reemplaza planillas Excel/Word y registros
físicos fragmentados por un sistema trazable, con alertas sobre eventos críticos.

El complemento móvil vive en el repo `arguello-infancias-mobile` y comparte la misma base
de datos.

**La fuente de verdad del proyecto es [`AGENTS-WEB.md`](./AGENTS-WEB.md)** — arquitectura,
modelo de datos, roles, seguridad, roadmap y deuda conocida. Este README es solo para
levantar el entorno local.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19 + TypeScript (strict)
- [Supabase](https://supabase.com/) (Postgres + Auth + Storage), acceso vía `@supabase/ssr`
- TanStack Query para el estado de datos del cliente
- react-hook-form + zod 4 para formularios y validación
- Tailwind CSS 4 (tokens en `app/globals.css`, sin `tailwind.config.*`) + Radix UI

## Requisitos

- Node.js 20+
- Acceso a un proyecto de Supabase (URL + claves — pedirlas al equipo)

## Levantar el entorno local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear `.env.local` en la raíz con las variables de entorno (ver abajo).

3. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000) (o `http://127.0.0.1:3000` —
   ambos orígenes están habilitados en `next.config.ts` → `allowedDevOrigins`, necesario
   porque Next 16 por defecto bloquea recursos `/_next/*` desde orígenes que no sean
   `localhost`).

## Variables de entorno

| Variable | Dónde se usa | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y servidor | URL del proyecto Supabase. Pública. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y servidor | Clave anónima de Supabase. Pública, protegida por RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | `app/api/usuarios/route.ts` y `app/api/didit/webhook/route.ts` (server-only, vía `lib/supabase/admin.ts` en el webhook) | **Nunca** exponer al cliente. Crea usuarios como Admin y deja que el webhook de Didit, que no tiene sesión de usuario, guarde el resultado. |
| `DIDIT_WEBHOOK_SECRET` | `app/api/didit/webhook/route.ts` (server-only) | Verifica la firma HMAC del webhook de Didit (validación RENAPER). |
| `DIDIT_API_KEY` | `app/api/didit/sesiones` (server-only) | API key de la app de Didit (hoy, la de sandbox). Crea y consulta sesiones de verificación. |
| `DIDIT_WORKFLOW_ID` | `app/api/didit/sesiones` (server-only) | Workflow de Didit (`id_lookup` contra RENAPER, D-23). |
| `DIDIT_SANDBOX_SCENARIOS` | `app/api/didit/sesiones` (server-only) | **Solo local y preview, con la app de sandbox.** El preview de Vercel no está configurado (22/10): no hay una segunda base de Supabase. En `true`, deja elegir el resultado de Didit con `sandbox_scenario` para la QA (`prompts/045`). Nunca en producción. |
| `ANTHROPIC_API_KEY` | `lib/ia/redactarInformeSenaf.ts` (server-only) | **Opcional.** Si está, el borrador del informe SENAF se redacta con Claude; si no, con la plantilla. Cuenta de la Console de Anthropic (pago por uso, aparte de cualquier suscripción). **Nunca** con prefijo `NEXT_PUBLIC_`. |

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run test:unit` | Tests unitarios con el runner de Node (`tests/unit/`), sin dependencias extra |

Antes de dar por terminada una tarea: `npm run lint`, `npm run build`, y `npx tsc --noEmit`
si se tocaron tipos (ver flujo de trabajo completo en `AGENTS-WEB.md`).

## Base de datos

El schema vive en `supabase/migrations/` — es la fuente de verdad, no solo el proyecto
remoto. `supabase/migrations/20260620000031_clean_schema.sql` es la definición de schema
**vigente** ("reemplaza las migraciones 001-030 en una DB nueva"); ante cualquier duda
sobre una columna, ese archivo manda por sobre migraciones individuales más viejas.
Las migraciones 001-030 quedaron sin contenido (solo un comentario): fallaban en una base
vacía y se conservan para el historial de producción, donde ya están aplicadas.

### Supabase local (para probar migraciones)

Requiere Docker Desktop corriendo. La configuración está en `supabase/config.toml`.

```bash
npx supabase start      # levanta la base local y aplica todas las migraciones
npx supabase db reset   # vuelve a crear la base desde cero
npx supabase stop       # la frena
```

`start` muestra la URL y las claves locales. Para usarlas en la app, cargarlas en
`.env.local`; nunca usar la base de producción para pruebas.

Los tipos de dominio en `types/database.types.ts` se derivan de
`types/database.generated.ts` (generado con `supabase gen types` / el MCP de Supabase, no
se edita a mano).

## Estructura

Ver `AGENTS-WEB.md` § Arquitectura para el detalle completo de capas y convenciones. Resumen:

```
components/ui/            primitivas (shadcn/Radix)
components/entities/<e>/  Form.tsx + List.tsx por entidad
components/legajos/tabs/  sub-tabs del detalle de legajo
hooks/<entidad>/          un hook useQuery/useMutation por operación
lib/validations/*.schema.ts  un schema zod por entidad
supabase/migrations/      migraciones SQL — fuente de verdad del schema
prompts/                  historial de planes de implementación (Vibe Engineering + SDD)
```
