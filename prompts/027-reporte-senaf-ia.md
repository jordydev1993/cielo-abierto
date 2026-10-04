# 027 — Innovación 5: informe mensual para SENAF con borrador redactado por IA

**Tarjeta:** sin tarjeta todavía (se carga cuando Jordy confirme las decisiones D1–D6) — Jordy — Media
**Estado:** ✓ Aprobado el 2026-10-04 con las recomendaciones de D1–D6. Implementado (ver § Implementación).

## Objetivo

Que Dirección pueda generar, una vez por mes, el informe institucional para SENAF sin
armarlo a mano:

1. El sistema **calcula los números del mes con SQL** (casos activos, ingresos, egresos,
   evaluaciones, propuestas, seguimientos post-egreso).
2. **Claude redacta el texto** del informe a partir de esos números agregados, como
   borrador.
3. Una persona con rol `Admin` **revisa, corrige y aprueba** el texto.
4. El informe aprobado se descarga en PDF.

La IA solo redacta. Los números salen de la base, y el informe no vale como tal hasta
que alguien lo aprueba.

## Por qué IA acá y no en otra innovación

Ver el análisis del 2026-10-04: es la innovación con menor riesgo de las 8, porque **a la
IA solo le llegan datos agregados** (conteos y porcentajes), nunca nombres, DNI ni texto
libre de legajos, informes o intervenciones. Resuelve trabajo manual real y cumple la
regla de `AGENTS-WEB.md` § Fuera de alcance: la IA se justifica por el problema, no "porque
se puede".

## Contexto

- No existe nada de reportería: no hay ruta, ni tabla, ni librería de PDF
  (`PLAN-INTEGRACION-INNOVACIONES.md` § 1, fila 5).
- No hay ninguna integración con un proveedor de IA. La "predicción de severidad" de
  `app/api/incidentes/prediccion/route.ts` son reglas fijas más la moda del historial,
  no IA.
- **Bloqueante conocido**: no hay documento con el formato que pide SENAF. Este plan
  propone una estructura genérica (supuesto S1) que se ajusta cuando llegue el formato.
- Patrón de route handler con clave privilegiada: `app/api/usuarios/route.ts` (sesión +
  `get_my_role` = `Admin`, `401`/`403`).
- Patrón de auditoría: `fn_audit_trigger()` + `trg_audit_*` (`prompts/018`).

## Archivos inspeccionados

- `information_schema.columns` en vivo de `nnya`, `legajos`, `incidentes`,
  `intervenciones`, `informes`, `audiencias_judiciales`, `evaluacion_institucional`,
  `propuestas_mejora`, `seguimiento_post_egreso`: confirmar de qué columnas sale cada
  número.
- `informes`: es por NNyA (`nnya_id`, `legajo_id`). **No sirve** para guardar un informe
  institucional, porque no tiene un NNyA asociado.
- `app/api/incidentes/prediccion/route.ts`, `app/api/usuarios/route.ts`.
- `package.json`: Next 16.2.6, zod 4.4.3. No hay `@anthropic-ai/sdk` ni librería de PDF.

## Skills utilizadas

- `database-design` (tabla nueva + RLS), `role-permission` (solo `Admin`),
  `domain-validation` (qué espera SENAF), `documentation`.
- `claude-api` (Claude Code): modelo vigente, SDK de TypeScript y salidas estructuradas.

## Decisiones que necesita Jordy (antes de implementar)

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Se acepta mandar datos **agregados** de la residencia a un proveedor externo de IA (Anthropic)? | Sí, porque no viajan datos personales. Dejarlo documentado en `AGENTS-WEB.md` § Seguridad. |
| D2 | ¿Quién puede generar y aprobar el informe? | Solo `Admin`. Es un documento oficial ante SENAF. |
| D3 | ¿Se guarda el informe en una tabla nueva `reportes_senaf` o se regenera cada vez? | Tabla nueva, porque así queda registro de qué se envió, quién lo aprobó y con qué números. |
| D4 | Formato SENAF: ¿alguien puede conseguir el modelo de informe real? | Pedirlo a la residencia. Mientras tanto, usar la estructura de S1. |
| D5 | Librería de PDF (dependencia nueva). | `@react-pdf/renderer`: genera el PDF del lado del servidor sin navegador headless. Alternativa: dejar el PDF para un prompt aparte y entregar primero texto aprobado + copiar. |
| D6 | Dependencia `@anthropic-ai/sdk` y la variable `ANTHROPIC_API_KEY` (cuenta y costo). | SDK oficial. La clave solo del lado del servidor, en Vercel. Costo estimado: centavos de dólar por informe (un pedido por mes). |

## Supuestos

- **S1 — Estructura del informe** (hasta tener el formato SENAF): 1) Población del mes,
  2) Ingresos y egresos, 3) Situación judicial (audiencias), 4) Incidentes por gravedad,
  5) Evaluación institucional y propuestas, 6) Seguimiento post-egreso, 7) Observaciones
  de Dirección (campo libre, lo escribe una persona y **no pasa por la IA**).
- **S2 — Período**: mes calendario (`periodo_mes`, `periodo_anio`), igual que
  `evaluacion_institucional`.
- **S3 — Modelo**: `claude-opus-5-5` (el modelo vigente por defecto), con salida
  estructurada y `effort: "medium"`. Para un pedido mensual el costo no pesa.

## Diseño

### Flujo

```
Admin elige mes/año → POST /api/reportes/senaf
   1. Verifica sesión + rol Admin (get_my_role)            → 401 / 403
   2. Calcula los agregados con SQL (cliente server, RLS)
   3. Arma el JSON de agregados (solo números y categorías)
   4. Llama a Claude con salida estructurada → borrador por sección
   5. Verifica que el borrador no invente números (ver Requisitos R4)
   6. Guarda en reportes_senaf (estado 'borrador')         → audit_log
Admin revisa / edita el texto en /reportes-senaf/[id] → "Aprobar"
   7. estado 'aprobado', aprobado_por, aprobado_at          → audit_log
   8. Descargar PDF (solo si está aprobado)
```

### Agregados que se calculan (solo conteos)

| Dato | Fuente |
|---|---|
| NNyA activos al cierre del mes, por género y franja de edad | `nnya` (`activo`, `genero`, `fecha_nacimiento`) |
| Ingresos del mes | `legajos.fecha_apertura` en el mes |
| Egresos del mes | `nnya.fecha_egreso` en el mes |
| Audiencias del mes, por estado | `audiencias_judiciales` (`fecha_hora`, `estado`) |
| Incidentes del mes, por gravedad | `incidentes` (`fecha_hora`, `gravedad`) |
| Intervenciones del mes, por tipo | `intervenciones` (`fecha`, `tipo`) |
| Evaluación institucional del mes y propuestas por estado | `evaluacion_institucional`, `propuestas_mejora` |
| Seguimientos post-egreso programados y realizados, e indicador de reinserción promedio | `seguimiento_post_egreso` |

**Nunca se envían a la IA**: `nombre`, `apellido`, `dni`, `domicilio`, `numero_expediente`,
ni ningún campo de texto libre (`descripcion`, `observaciones`, `contenido`, `resultado`,
`acciones_tomadas`, `detalle_incumplimiento`). Los tipos de intervención e incidente sí,
porque son categorías.

### Llamada a Claude (TypeScript, SDK oficial)

```ts
// lib/ia/redactarInformeSenaf.ts (server-only)
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno del servidor

const response = await client.messages.parse({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  output_config: { effort: "medium", format: zodOutputFormat(BorradorSchema) },
  system: SYSTEM_PROMPT, // fijo: rol, tono institucional, reglas sobre los números
  messages: [{ role: "user", content: JSON.stringify(agregados) }],
});
// Revisar stop_reason ("refusal", "max_tokens") antes de usar parsed_output.
```

- `BorradorSchema` (zod): `{ secciones: [{ clave, titulo, texto }], advertencias: string[] }`.
  `advertencias` es donde el modelo señala datos faltantes o llamativos, por ejemplo
  "no hubo evaluación institucional este mes".
- Activar el respaldo ante rechazos del servidor (`fallbacks: "default"` con la beta
  `server-side-fallback-2026-07-01`, por la ruta `client.beta.messages`): si el modelo
  declina el pedido, la API lo reintenta en otro modelo dentro de la misma llamada. Con
  datos agregados es poco probable, pero es la configuración recomendada. Si igual vuelve
  `stop_reason: "refusal"`, aplica R5.
- Para la implementación: verificar que `zodOutputFormat` funcione con zod 4.4.3. Si no,
  pasar el JSON Schema a mano en `output_config.format`.
- El system prompt pide un tono institucional en castellano rioplatense formal y
  **prohíbe escribir cifras que no estén en el JSON**. Tampoco puede inferir causas ni
  emitir juicios sobre casos.

## Archivos a crear / modificar

| Archivo | Qué |
|---|---|
| `supabase/migrations/<ts>_reportes_senaf.sql` | Tabla `reportes_senaf`: `id`, `periodo_mes`, `periodo_anio`, `datos` (jsonb, los agregados), `borrador_ia` (jsonb), `texto_final` (jsonb), `observaciones_direccion`, `modelo`, `estado` (`borrador`/`aprobado`), `generado_por`, `aprobado_por`, `aprobado_at`, timestamps. `UNIQUE(periodo_mes, periodo_anio)` para un informe aprobado por mes. RLS solo `Admin`. Trigger `trg_audit_reportes_senaf`. |
| `lib/reportes/agregadosSenaf.ts` | Consultas de agregados (server). |
| `lib/ia/redactarInformeSenaf.ts` | Cliente de Claude + system prompt + `BorradorSchema`. Server-only. |
| `lib/validations/reporteSenaf.schema.ts` | Zod del período y de la edición del texto. |
| `app/api/reportes/senaf/route.ts` | `POST` (generar borrador). Mismo patrón de rol que `app/api/usuarios`. |
| `app/api/reportes/senaf/[id]/pdf/route.ts` | `GET` del PDF, solo si `estado = 'aprobado'` (depende de D5). |
| `hooks/reportes/` | `useReportesSenaf`, `useGenerarReporteSenaf`, `useActualizarReporteSenaf`, `useAprobarReporteSenaf`. |
| `app/(dashboard)/reportes-senaf/page.tsx` y `[id]/page.tsx` | Lista por mes + editor por sección, con los números de referencia al lado. |
| `components/entities/reporte-senaf/` | `Form.tsx` (editor) + `List.tsx`. |
| Sidebar | Entrada "Informe SENAF", solo visible para `Admin` (`AccessGuard`). |
| `types/database.generated.ts` | Regenerar (`prompts/020`). |
| `AGENTS-WEB.md` | Módulo nuevo, decisión D1 en § Seguridad y `ANTHROPIC_API_KEY` en § Contratos de API. |
| `README.md` | Variable de entorno nueva. |

## Requisitos

- **R1** — Solo `Admin` genera, edita, aprueba y descarga, con verificación en la UI, en el
  route handler y en RLS.
- **R2** — `ANTHROPIC_API_KEY` solo del lado del servidor. Nunca `NEXT_PUBLIC_`. El cliente
  de Claude no se importa desde componentes cliente.
- **R3** — El JSON que se manda a la IA se arma con una lista blanca de campos. Hay un test
  unitario que falla si aparece cualquier clave fuera de esa lista.
- **R4** — **Control de números inventados**: después de generar, se extraen todas las
  cifras del texto y se comparan con los valores de `datos`. Si alguna no aparece, el
  borrador se guarda igual pero con una advertencia visible al lado de esa sección.
- **R5** — Si la API de Claude falla (timeout, 429, 5xx, `refusal`), se informa con un
  error legible y se puede reintentar. Los agregados igual se guardan, para poder redactar
  a mano. El sistema no se rompe si la IA no está disponible.
- **R6** — Un informe `aprobado` no se edita más. Para corregirlo se genera una versión
  nueva, que también queda auditada.
- **R7** — En el PDF y en la pantalla se aclara que el texto fue redactado con asistencia
  de IA y revisado por la persona que lo aprobó.

## Seguridad

- No viajan datos personales al proveedor de IA (R3). Igual queda pendiente revisar la
  política de retención de datos de la cuenta de Anthropic que se use (D1).
- Toda generación, edición y aprobación queda en `audit_log` por trigger.
- La responsabilidad del contenido es de quien aprueba (`aprobado_por`), no de la IA.
- Con 5 NNyA, algunos conteos son chicos (por ejemplo "1 egreso"). Para Anthropic no es un
  dato identificable, pero el PDF final sí puede serlo para quien conoce la residencia.
  Esto es igual que el informe que hoy se hace a mano, así que no hay cambio de riesgo.

## Criterios de aceptación

1. Un `Admin` elige un mes y obtiene un borrador con las 7 secciones de S1 en menos de 1
   minuto.
2. Un usuario `Equipo Tecnico` recibe `403` en la API y no ve la entrada en el sidebar.
   Una consulta directa a `reportes_senaf` con su sesión devuelve 0 filas (RLS).
3. El JSON enviado a Claude no contiene ninguna clave fuera de la lista blanca (test R3).
4. Si se fuerza un número que no está en `datos`, la sección muestra la advertencia (R4).
5. Sin `ANTHROPIC_API_KEY`, o con la API caída, la pantalla muestra el error y deja
   redactar a mano (R5).
6. Aprobar fija `aprobado_por` y `aprobado_at`, bloquea la edición y deja una fila en
   `audit_log`.
7. El PDF solo se descarga con el informe aprobado (si D5 entra en este prompt).

## Chequeos

`npm run lint`, `npm run build`, `npx tsc --noEmit` (se tocan tipos), más el test unitario
de R3 y R4.

## Verificación manual

1. Como `Admin`, ir a "Informe SENAF", elegir el mes actual y generar.
2. Comparar cada cifra del borrador con los números de referencia de la columna lateral.
3. Editar una sección, guardar, aprobar y confirmar que ya no se puede editar.
4. Descargar el PDF y revisar la aclaración de R7.
5. Como `Equipo Tecnico`, confirmar que la entrada no aparece y que `POST
   /api/reportes/senaf` devuelve `403`.
6. Quitar `ANTHROPIC_API_KEY` en local, generar y confirmar el error legible (R5).
7. En Supabase: `select * from audit_log where tabla = 'reportes_senaf'` muestra la
   creación, la edición y la aprobación.

## Implementación (2026-10-04)

Decisiones aplicadas: D1 sí (solo agregados), D2 solo `Admin`, D3 tabla `reportes_senaf`,
D4 formato propio (no existe un modelo de SENAF), D5 `@react-pdf/renderer`, D6
`@anthropic-ai/sdk` con `ANTHROPIC_API_KEY` server-side.

Diferencias con el plan, y por qué:

- **La IA es opcional.** Sin `ANTHROPIC_API_KEY` (o si la API falla) el borrador se arma con
  una plantilla determinista (`redactarConPlantilla`). Así el módulo funciona sin costo
  desde el primer día y la IA se activa cargando la clave en Vercel. Cubre R5.
- **7 secciones generadas + observaciones de Dirección.** Se sumó "Intervenciones
  profesionales" a las 6 de S1, porque el dato ya se calculaba. Las observaciones siguen
  siendo un campo aparte que no pasa por la IA.
- **La firma la pone la base.** Un trigger completa `aprobado_por`/`aprobado_at` con el
  usuario de la sesión, así nadie puede aprobar a nombre de otro (migración
  `20261004191723`).
- **Agregados en una función SQL** (`fn_agregados_senaf`, SECURITY INVOKER + chequeo de
  `Admin`) en vez de consultas sueltas en TypeScript. Solo agrega columnas con dominio
  cerrado: los tipos de intervención y de audiencia son texto libre en la base, por eso se
  informan solo totales y estados.
- **Tests con `node:test`** (`npm run test:unit`), sin agregar un framework de testing.
  Se habilitó `allowImportingTsExtensions` en `tsconfig.json` (sin efecto en el build:
  `noEmit` ya estaba activo).

Verificado:

- `npm run test:unit` (7/7), `npx tsc --noEmit`, `npm run build` y lint de los archivos
  nuevos sin errores. El lint del repo completo ya tenía 95 problemas previos, ninguno en
  estos archivos.
- En la base, dentro de transacciones revertidas: `fn_agregados_senaf` responde con
  `Admin` y rechaza a otros roles; un usuario sin rol ve 0 filas de `reportes_senaf`; al
  aprobar, la firma es la del usuario de la sesión aunque se intente poner otra; un informe
  aprobado no se puede modificar; INSERT y UPDATE quedan en `audit_log`.
- PDF renderizado con datos reales de septiembre de 2026 (plantilla).

Verificado en Chrome (2026-10-04, `next dev`, usuario Admin, período de prueba enero de 2024):
generar el borrador (plantilla), comparar cada cifra con el panel de datos, editar y
guardar las observaciones, aprobar (firma de la sesión, campos bloqueados), descargar el
PDF (200, `application/pdf`), generar una versión 2 e intentar aprobarla (error "Ya hay un
informe aprobado para ese período"). Sin errores en consola. Se corrigió el título
"Enero De 2024" (`tituloPeriodo`). Las 2 filas de prueba se borraron después; sus
entradas en `audit_log` quedan, porque el log es inmutable.

Pendiente: la redacción con IA, que necesita `ANTHROPIC_API_KEY`. Mejora posible: el
control de cifras (R4) corre al generar, no al editar el texto a mano.
