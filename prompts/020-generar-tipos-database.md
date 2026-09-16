# 020 — Generar `types/database.types.ts` con `supabase gen types`

**Tarjeta:** [#8](https://github.com/jordydev1993/cielo-abierto/issues/8) — Jordy — Media

## Objetivo

Cerrar la deuda documentada en `AGENTS-WEB.md`: `types/database.types.ts` se escribía
a mano (issue #29 en la numeración vieja, #8 en el tablero actual) en vez de generarse
desde el schema real, con riesgo de que los tipos divergieran de la base sin que nadie lo
notara.

## Contexto

- `mcp__supabase__generate_typescript_types` (equivalente a `supabase gen types
  typescript`) genera un tipo `Database` con `Row`/`Insert`/`Update` por tabla, pero
  **no infiere los valores literales de los `CHECK (columna IN (...))`** — esas columnas
  salen como `string` plano. El código actual depende fuertemente de esos literales
  (`estado: 'activo' | 'cerrado' | 'archivado'`, etc.) en selects condicionales, badges y
  validación — perderlos habría sido una regresión real de type-safety, no una mejora.
- Reemplazar `database.types.ts` de punta a punta por el tipo `Database` generado hubiera
  obligado a tocar los ~40 archivos que importan `Nnya`, `Legajo`, `Referente`, etc. — fuera
  de proporción para lo que pide la tarjeta.

## Decisión de diseño

Dos archivos en vez de uno:

- `types/database.generated.ts` — el output crudo del generador, tal cual. Es la fuente de
  verdad regenerable: para actualizarlo, correr
  `mcp__supabase__generate_typescript_types` de nuevo y pegar el resultado acá. No se edita
  a mano.
- `types/database.types.ts` — reescrito para derivar cada tipo de dominio
  (`Nnya`, `Legajo`, `Referente`, etc.) de `Database['public']['Tables'][x]['Row']` vía un
  helper `Row<T>`, angostando con `Omit<Row<T>, 'campo'> & { campo: 'a' | 'b' }` los campos
  que son `CHECK` en la base, y agregando las propiedades opcionales de relación
  (`nnya?`, `usuarios?`, `tutores?`) que los `select('*, tabla(...)')` con join devuelven y
  que el generador no puede inferir (no vienen del `Row` de la tabla).

Resultado: **los ~40 archivos que importan tipos de `database.types.ts` no necesitaron
ningún cambio** — mismos nombres, misma forma pública, ahora con una base verificada contra
el schema real en vez de tipeada de memoria.

## Archivos creados/modificados

- `types/database.generated.ts` (nuevo)
- `types/database.types.ts` (reescrito completo)
- `AGENTS-WEB.md`: gap `types` movido a "Resuelto"; nuevo gap `legajo-id-nullable`
  documentado (ver abajo)

## Hallazgos al comparar campo por campo contra las 28 tablas reales

1. **`Actividad` estaba duplicada** en el archivo viejo (dos `interface Actividad`
   idénticas, TypeScript las fusionaba por declaration merging sin error, pero era dead
   code). Eliminada la duplicada, se conservó la versión con `usuarios?` (relación usada
   por `ActividadList`).
2. **`legajo_id` es `nullable` en la base real, no `NOT NULL`** — en las 7 tablas que lo
   tienen (`turnos`, `incidentes`, `diagnosticos`, `medicamentos`, `informes`,
   `documentos`, `audiencias_judiciales`), verificado contra
   `supabase/migrations/20260620000031_clean_schema.sql`:
   `legajo_id UUID REFERENCES legajos(id) ON DELETE CASCADE` — sin `NOT NULL`. Los tipos a
   mano lo declaraban como `string` (requerido) en las 7 interfaces. Es un desvío real
   entre el tipo y el schema, exactamente el tipo de problema que esta tarjeta buscaba
   prevenir.

   **No lo "corregí" silenciosamente** en ningún sentido — mantuve `legajo_id: string`
   (no nulo) en el tipo de dominio, porque:
   - Todo formulario de alta de esas 7 entidades exige seleccionar un legajo (campo
     requerido en el zod schema); ningún flujo actual inserta una fila sin él.
   - Angostar el tipo a `string | null` de verdad habría roto en compilación ~10 sitios
     que hacen `queryKeys.X.byLegajo(data.legajo_id)` asumiendo no-nulo (`data` es la
     respuesta de un `insert().select().single()`), sin que hubiera ningún bug real detrás
     — la garantía es de negocio (formulario), no de base.
   - Quedó documentado como gap nuevo en `AGENTS-WEB.md` (`#legajo-id-nullable`): decisión
     pendiente para Jordy entre agregar `NOT NULL` a las 7 columnas (alinea la base con lo
     que la app ya asume) o aceptar el nullable y ajustar tipos/UI en consecuencia. No se
     tocó SQL en este prompt.
3. **`audit_log` no tenía tipo** (no lo necesitaba ningún componente hasta ahora). Se
   agregó `AuditLog = Row<'audit_log'>` ya que quedó trivialmente disponible al generar, y
   cierra la vuelta con el trabajo de `prompts/018`.
4. Todo lo demás (roles, usuarios, nnya, tutores, legajos, alertas, intervenciones,
   novedades, turnos_personal, seguimiento_post_egreso, evaluación institucional,
   propuestas_mejora, y las 4 tablas de FASE B) coincidió campo por campo con lo ya
   tipeado — sin más sorpresas.

## Requisitos

- No se modifica ningún archivo fuera de `types/` y `AGENTS-WEB.md`.
- Todos los nombres de tipo exportados (`Nnya`, `Legajo`, `Usuario`, etc.) se mantienen
  idénticos.

## Seguridad

- Sin cambios de RLS, sin cambios de runtime — es un cambio de tipos puro (se borra en
  compilación).

## Criterios de aceptación

- `npx tsc --noEmit` sin errores nuevos.
- `npm run build` sin errores.
- Ningún archivo fuera de `types/database.types.ts`/`types/database.generated.ts` requiere
  cambios.

## Chequeos

- `npx tsc --noEmit` → limpio.
- `npm run build` → limpio, mismas rutas que antes.
- `npm run lint` sobre los 2 archivos nuevos → limpio.
- Verificado en navegador (`/nnya`, `/incidentes`) que la app sigue funcionando igual
  (esperable, ya que es un cambio de solo tipos).

## Verificación manual

No aplica verificación de UI (cambio interno de tipos). Para confirmar que sigue
sincronizado en el futuro: correr `mcp__supabase__generate_typescript_types` después de
cualquier migración nueva y diffear contra `types/database.generated.ts` — si hay
diferencias de columnas/nullability no reflejadas en `database.types.ts`, TypeScript las
marca solo con pegar el nuevo output (los `Omit<Row<T>, 'campo'>` fallan si `campo` deja de
existir en `Row<T>`).

---

**Estado**: implementado y verificado (`tsc --noEmit`, `npm run build`, smoke test en
navegador).

## Actualización — decisión de `legajo_id` resuelta

Jordy decidió agregar `NOT NULL` a las 7 columnas (opción de bajo riesgo: solo endurece una
regla que la app ya impone en cada formulario). Verificado 0 filas con `legajo_id NULL` en
las 7 tablas antes de aplicar. Migración `20260915193141_legajo_id_not_null.sql`. Se
simplificó `database.types.ts`: los 7 `Omit<Row<T>, 'legajo_id' | ...>` que angostaban el
campo a mano ya no hacen falta, `Row<T>` ahora lo trae correcto (no nulo) directo del
generador.
