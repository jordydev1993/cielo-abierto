# Informe de faltantes por integrante + guía de prompts (Vibe Engineering + SDD)

**Fecha:** 2026-09-15
**Fuente:** tablero del equipo (https://github.com/users/jordydev1993/projects/1), consultado en vivo — no es una foto vieja.
**Objetivo:** que cada uno sepa exactamente qué le falta, y cómo pedirle a Claude Code el plan de esa tarea sin depender de que otro se lo arme.

> Este documento asume que ya leíste `GUIA-PROCESO-COMPLETO.md` (el ciclo completo: tarjeta → rama → PLAN → aprobación → implementar → PR → merge). Acá el foco es más chico: **cómo escribir el pedido inicial** para que el PLAN salga bien de entrada.

---

## Cómo escribir un buen pedido (la base, para los 4)

Un pedido que dispara un buen PLAN tiene 3 partes. Plantilla para pegar en Claude Code:

```
Contexto: soy <tu nombre>, tarjeta #<N> del tablero (<pegá el título>).
Repo: <cielo-abierto | arguello-infancias-mobile>

Pedido: Leé AGENTS.md (o AGENTS-WEB.md si es el repo web) + la skill que corresponda
(skills/design.md, skills/testing.md, skills/database.md), inspeccioná <archivo o
carpeta relacionado a tu tarea>, y escribime un PLAN en prompts/NN-slug.md para
<qué querés lograr, en una frase>.

No implementes todavía — quiero revisar el plan primero.
```

Por qué funciona:
- **"Leé AGENTS.md + la skill"** — obliga a Claude Code a usar las reglas del proyecto, no inventar de cero.
- **Nombrar el archivo/carpeta relacionado** — le ahorra tiempo de exploración y evita que toque algo que no le pediste.
- **"No implementes todavía"** — es el freno explícito que exige `AGENTS.md`/`AGENTS-WEB.md` ("No saltees el PLAN. Nunca."). Sin esta línea, a veces se apura.

Una vez que el plan está escrito, lo leés y respondés **"✓ Aprobado"** o **"✕ Cambiar X"** — recién ahí se implementa.

**Si tu tarea es de documentación/decisión, no de código** (le pasa sobre todo a Sofi y a partes de Cami): el mismo pedido funciona, solo que el plan va a ser más corto (sin sección de chequeos técnicos) — no hace falta pedir nada distinto.

---

## Jordy — 20 tarjetas pendientes

El volumen más grande, repartido en 3 frentes. Agrupado por tema (no una por una, son muchas):

| Frente | Tarjetas | Prioridad |
|---|---|---|
| **Mobile — features** | F2 form novedades [#11](https://github.com/jordydev1993/arguello-infancias-mobile/issues/11), F4 form actividades [#12](https://github.com/jordydev1993/arguello-infancias-mobile/issues/12), F3 detalle+separadores [#13](https://github.com/jordydev1993/arguello-infancias-mobile/issues/13) (en curso), F5 navegación a detalle [#14](https://github.com/jordydev1993/arguello-infancias-mobile/issues/14) (en curso), F6 formulario completo [#15](https://github.com/jordydev1993/arguello-infancias-mobile/issues/15) (en curso) | Alta/Media |
| **Mobile — backend** | Conectar Supabase [#16](https://github.com/jordydev1993/arguello-infancias-mobile/issues/16) ✅ ya resuelta esta sesión, falta que la marques `Hecha` si no lo hiciste — Backend F1–F6 [#17](https://github.com/jordydev1993/arguello-infancias-mobile/issues/17), correcciones `ON DELETE`/soft-delete [#18](https://github.com/jordydev1993/arguello-infancias-mobile/issues/18) | Alta/Media |
| **Web — deuda técnica** | Audit log real [#2](https://github.com/jordydev1993/cielo-abierto/issues/2) (bloqueada), rol rot [#3](https://github.com/jordydev1993/cielo-abierto/issues/3), `types/database.types.ts` a mano [#8](https://github.com/jordydev1993/cielo-abierto/issues/8), DNI sin cifrar [#11](https://github.com/jordydev1993/cielo-abierto/issues/11), README boilerplate [#12](https://github.com/jordydev1993/cielo-abierto/issues/12) | Alta a Baja |
| **Web — FASES B-E** | UI tutela/referentes [#4](https://github.com/jordydev1993/cielo-abierto/issues/4), evaluación institucional [#5](https://github.com/jordydev1993/cielo-abierto/issues/5), turnos personal [#6](https://github.com/jordydev1993/cielo-abierto/issues/6), seguimiento post-egreso [#7](https://github.com/jordydev1993/cielo-abierto/issues/7) | Media/Baja |
| **Entregas** | Entregable 1 ISO 12207 [#22](https://github.com/jordydev1993/arguello-infancias-mobile/issues/22) (en revisión), Entrega Unidad I [#27](https://github.com/jordydev1993/arguello-infancias-mobile/issues/27) (en revisión), exposición oral [#28](https://github.com/jordydev1993/arguello-infancias-mobile/issues/28) | Media/Alta |

**Además, sin tarjeta todavía** (recién analizado, no implementado):
- 3 planes ya escritos y aprobables en `mobile/prompts/05`, `06`, `07` (gradientes, filtro por categoría, paginación) — faltan crearles tarjeta si querés trackearlos.
- El informe de Didit/validación de identidad (`arguello-infancias/INFORME-VALIDACION-IDENTIDAD-RETIRO-DIDIT.md`) — es solo análisis, 0% implementado, sin tarjetas todavía.

**Ejemplo de pedido para la próxima** (Backend F1–F6, #17):
```
Contexto: soy Jordy, tarjeta #17 (Backend F1–F6).
Repo: arguello-infancias-mobile

Pedido: Leé AGENTS.md + skills/database.md, inspeccioná src/lib/supabase.ts y
src/hooks/useResidents.ts (ya conectado, como referencia del patrón), y escribime
un PLAN en prompts/NN-backend-f2.md para conectar F2 (novedades) a la tabla
novedades real, siguiendo el mismo patrón que F1.

No implementes todavía.
```

---

## Meli — 3 tarjetas pendientes

| Tarjeta | Qué es |
|---|---|
| [#19](https://github.com/jordydev1993/arguello-infancias-mobile/issues/19) Tests de los 51 criterios (CA-01 a CA-51) | Falta escribir y correr los tests contra los criterios ya definidos en `skills/testing.md` |
| [#9](https://github.com/jordydev1993/cielo-abierto/issues/9) Tests automatizados web | Playwright está instalado, 0 tests escritos |
| [#23](https://github.com/jordydev1993/arguello-infancias-mobile/issues/23) Entregable 2 ISO 12207 (en curso) | Cumplimiento de la norma por proceso |

**Ejemplo de pedido** (para #9, tests web):
```
Contexto: soy Meli, tarjeta #9 (Tests automatizados web).
Repo: cielo-abierto

Pedido: Leé AGENTS-WEB.md + docs/testingManual/MANUAL_TESTING.md, inspeccioná
cómo está configurado playwright en el proyecto (package.json, si hay algún
config), y escribime un PLAN en prompts/016-tests-e2e-nnya.md para el primer
set de tests E2E: login + alta de un NNyA + verificación en la lista.

No implementes todavía.
```

---

## Cami — 5 tarjetas pendientes

| Tarjeta | Qué es |
|---|---|
| [#20](https://github.com/jordydev1993/arguello-infancias-mobile/issues/20) Revisión UI/UX de F2–F6 | Contra `skills/design.md` y los wireframes |
| [#21](https://github.com/jordydev1993/arguello-infancias-mobile/issues/21) Integrar `SelectField`/`TextAreaField` en F2/F4 | Cuando esas pantallas existan (depende de #11/#12 de Jordy) |
| [#10](https://github.com/jordydev1993/cielo-abierto/issues/10) Design system web | Escala tipográfica, `Toaster`, colores hardcodeados en `NnyaTable` |
| [#25](https://github.com/jordydev1993/arguello-infancias-mobile/issues/25) Entregable 4 ISO 12207 (en curso) | Mejoras propuestas (una por hallazgo de Sofi) |
| [#26](https://github.com/jordydev1993/arguello-infancias-mobile/issues/26) Matriz RACI | Vos misma la propusiste en el entregable 4 — todavía no existe el archivo |

**Además, sin tarjeta:** el plan de gradientes (`mobile/prompts/05-gradientes-imagenes.md`) es tuyo por tema — está escrito, esperando `✓ Aprobado`.

**Ejemplo de pedido** (para #10, design system web):
```
Contexto: soy Cami, tarjeta #10 (Design system web).
Repo: cielo-abierto

Pedido: Leé AGENTS-WEB.md + docs/design-system.md (sección "Huecos detectados"),
inspeccioná components/entities/nnya/NnyaTable.tsx (tiene colores hardcodeados
tipo text-slate-500), y escribime un PLAN en prompts/017-design-system-huecos.md
para cerrar esos huecos: escala tipográfica nombrada, variantes warning/info
del Toaster, y sacar los colores hardcodeados de NnyaTable.

No implementes todavía.
```

---

## Sofi — 5 tarjetas pendientes

Las 4 decisiones del modelo de datos ya están resueltas (issues #1-#4, cerradas) — esto es lo que se destrabó:

| Tarjeta | Qué es |
|---|---|
| [#5](https://github.com/jordydev1993/arguello-infancias-mobile/issues/5) Reescribir `RESUMEN-SESION-MODELO-DATOS.md` | Con las 4 decisiones ya resueltas como base |
| [#6](https://github.com/jordydev1993/arguello-infancias-mobile/issues/6) Reescribir `RECOMENDACIONES-MODELO-DATOS.md` | Ídem |
| [#7](https://github.com/jordydev1993/arguello-infancias-mobile/issues/7) Reescribir `CORRECCIONES-MODELO-DATOS-ARGUELLO.md` | Ídem — ojo, esa versión vieja tenía un script que hubiera duplicado `audit_log`, no ejecutarlo |
| [#8](https://github.com/jordydev1993/arguello-infancias-mobile/issues/8) Actualizar `AGENTS.md` de mobile §[5] | Sacar las 7 tablas viejas del docx, reflejar el modelo real |
| [#24](https://github.com/jordydev1993/arguello-infancias-mobile/issues/24) Entregable 3 ISO 12207 (en curso) | Incumplimientos y debilidades |

**Ejemplo de pedido** (para #5, el más simple de los 4 reescribe-docs):
```
Contexto: soy Sofi, tarjeta #5 (Reescribir RESUMEN-SESION-MODELO-DATOS.md).
Repo: arguello-infancias-mobile

Pedido: Leé docs/04-backend/modelo-de-datos/CORRECCIONES-Y-DUDAS-PARA-MELI-SOFI.md
completo (ahí están las 4 decisiones ya resueltas, sección 3), y escribime un
PLAN en prompts/NN-resumen-modelo-datos.md para reescribir
RESUMEN-SESION-MODELO-DATOS.md reflejando el modelo real (reusar nnya/usuarios/
incidentes/actividades, solo novedades es tabla nueva).

No implementes todavía — esta es una tarea de documentación, el plan puede ser
corto.
```

---

## Resumen

| Persona | Pendientes | Frente principal |
|---|---|---|
| Jordy | 20 | Código (mobile F2-F6, backend, deuda web) |
| Meli | 3 | Tests (mobile + web) |
| Cami | 5 | UI/UX + diseño + RACI |
| Sofi | 5 | Documentación del modelo de datos |

Estado siempre actualizado en el tablero: https://github.com/users/jordydev1993/projects/1
