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
| `SUPABASE_SERVICE_ROLE_KEY` | `app/api/usuarios/route.ts` (server-only) | **Nunca** exponer al cliente. Se usa solo para crear usuarios como Admin. |
| `DIDIT_WEBHOOK_SECRET` | `app/api/didit/webhook/route.ts` (server-only) | Verifica la firma HMAC del webhook de Didit (validación RENAPER). |

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

Antes de dar por terminada una tarea: `npm run lint`, `npm run build`, y `npx tsc --noEmit`
si se tocaron tipos (ver flujo de trabajo completo en `AGENTS-WEB.md`).

## Base de datos

El schema vive en `supabase/migrations/` — es la fuente de verdad, no solo el proyecto
remoto. `supabase/migrations/20260620000031_clean_schema.sql` es la definición de schema
**vigente** ("reemplaza las migraciones 001-030 en una DB nueva"); ante cualquier duda
sobre una columna, ese archivo manda por sobre migraciones individuales más viejas.

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
