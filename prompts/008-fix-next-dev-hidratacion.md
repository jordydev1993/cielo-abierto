# 008 — `next dev` no hidrata en `127.0.0.1`

## Objetivo

Cerrar el último gap de `AGENTS-WEB.md` § Deuda conocida: `next dev` (Turbopack y webpack) nunca hidrataba la app cuando se accedía por `127.0.0.1:3001` — cualquier formulario se comportaba como HTML puro (submit nativo por GET, sin validación, sin llamadas a Supabase).

## Contexto y causa raíz

Encontrada revisando el propio log de `next dev`, algo que no se había mirado en la investigación previa (centrada en el navegador, no en el server):

```
⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "127.0.0.1".
Cross-origin access to Next.js dev resources is blocked by default for safety.
```

Next.js 15.3+/16 bloquea por defecto, en modo desarrollo, las peticiones a recursos internos (`/_next/*`, incluido el bootstrap de hidratación) que no vengan del origen exacto que el propio dev server considera "local" — que es `localhost`, no `127.0.0.1`, aunque ambos apunten al mismo loopback (son orígenes distintos para el navegador). Como toda la sesión de pruebas se hizo contra `127.0.0.1:3001`, el bloqueo era sistemático y silencioso (no lanza una excepción de JS capturable — el recurso simplemente no se sirve).

Esto explica retroactivamente todo lo observado durante la verificación de `005`/`006`:
- Por qué nunca hidrataba, con ningún bundler.
- Por qué sobrevivió a un `rm -rf node_modules && npm install` limpio (no era un problema de dependencias).
- Por qué cambiar de Turbopack a `--webpack` no cambió nada (el guardia de origen es independiente del bundler).
- Por qué `next build && next start` (producción) siempre funcionó — ese guardia solo existe en modo desarrollo.

## Archivos inspeccionados

- Log de `npm run dev` (`next dev -p 3001`), no revisado en la investigación previa.
- `next.config.ts` (config vacía, sin `allowedDevOrigins`).

## Archivos a modificar

- `next.config.ts`: agregar `allowedDevOrigins: ['127.0.0.1']`.

## Supuestos

- Se agrega únicamente `127.0.0.1` (el host efectivamente usado en esta máquina para desarrollo/pruebas). Si en el futuro se accede desde otro host (ej. una IP de LAN para probar desde otro dispositivo), habrá que agregarlo a la misma lista.
- No se toca nada de producción — `allowedDevOrigins` es una opción exclusiva de `next dev`, no tiene efecto en `next build`/`next start`.

## Criterios de aceptación

- `npm run dev` en `127.0.0.1:3001` hidrata correctamente: formularios validan del lado del cliente, no hay submits nativos por GET, la navegación entre pantallas es SPA (sin recarga completa).
- El log de `next dev` ya no muestra el warning "Blocked cross-origin request".
- `next build` sigue funcionando sin cambios.

## Chequeos

- `npm run lint`
- `tsc --noEmit`
- `npm run build`

## Verificación manual

Ya realizada durante el diagnóstico:
1. Reiniciar `next dev` con el cambio aplicado → confirmar que el warning desaparece del log.
2. Ir a `/dashboard` (ya autenticado) → confirmar hidratación real (elementos con fiber props de React, no solo el overlay de dev tools).
3. Click en un link del sidebar (`Legajos`) → confirmar navegación SPA instantánea sin recarga de página.
4. `/login` con campos vacíos → confirmar que aparecen los mensajes de validación de react-hook-form/zod en vez de un submit nativo por GET.

---

**Estado**: implementado y verificado end-to-end en el navegador (`next dev`, hidratación confirmada, navegación SPA funcionando).
