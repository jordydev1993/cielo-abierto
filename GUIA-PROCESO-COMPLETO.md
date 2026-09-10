# Guía de proceso — de la tarjeta al merge

Cómo se resuelve **una** tarea de principio a fin y se encadena con la siguiente. Aplica a los dos repos (`cielo-abierto` = web, `arguello-infancias-mobile` = mobile). Las diferencias entre ambos están en la tabla del final.

- **Tablero:** https://github.com/users/jordydev1993/projects/1
- **Cómo funciona el tablero:** `GESTION-AVANCE-EQUIPO.md`
- **Metodología:** Vibe Engineering + SDD (definida en `AGENTS.md` de cada repo). Regla de oro: **no se implementa nada sin un PLAN aprobado**.

---

## 0. Una sola vez (setup)

1. **Aceptá las 3 invitaciones** que te llegan por mail (o en https://github.com/notifications):
   - colaboradora del repo `cielo-abierto`
   - colaboradora del repo `arguello-infancias-mobile`
   - colaboradora del Project
2. **Cloná y levantá los dos proyectos** siguiendo `GUIA-CLONAR-PROYECTOS.md` (o `GUIA-SOFIA-CLONAR-Y-TAREAS.md`).
3. Configurá `git` con tu nombre y mail si no lo hiciste:
   ```bash
   git config --global user.name "Tu Nombre"
   git config --global user.email "tu-mail@ejemplo.com"
   ```
4. Instalá **Claude Code** (`npm install -g @anthropic-ai/claude-code`) y abrilo dentro de la carpeta del repo en el que vas a trabajar.

---

## 1. Elegir la tarjeta

1. Abrí el tablero → vista **"Por responsable"** → buscá tu columna.
2. Elegí una tarjeta en **`Sin empezar`**, priorizando `Prioridad = Alta`. Si no sabés cuál, preguntá en el grupo o mirá qué desbloquea a otros.
3. Movela a **`En curso`** y escribí en el campo **Nota** en una línea qué vas a hacer.
4. Abrí el **issue** de esa tarjeta (el link está en la tarjeta). En el cuerpo del issue está **el archivo o carpeta del repo con el contexto completo** — leelo antes de seguir.

> Regla: una tarjeta `En curso` por persona a la vez. Si tenés que dejar una a medias, volvela a `Sin empezar` o `Bloqueada` con una Nota.

---

## 2. Preparar la rama

Siempre se trabaja en una rama nueva, nunca directo sobre la principal.

```bash
# parado en la carpeta del repo correcto
git checkout <principal>        # master en web, main en mobile
git pull                        # traés lo último
git checkout -b <tipo>/<slug>   # rama nueva para esta tarjeta
```

Nombre de rama: `<tipo>/<descripción-corta>`, con `<tipo>` = `feat`, `fix`, `docs`, `test` o `chore`. Ejemplos:
- `docs/decision-roles-mobile`
- `feat/f2-form-novedades`
- `test/criterios-f1`

---

## 3a. Resolver — tarea de código  (`tipo:build`, `tipo:design`, `tipo:test`)

El ciclo de `AGENTS.md`. **No te saltees el PLAN.**

1. **Contexto a Claude Code.** En la terminal de Claude Code, pedile el plan (no que implemente):
   > Leé `AGENTS.md` y `skills/<la que aplique>` y el archivo `<ruta del issue>`. Escribí un PLAN en `prompts/<NN>-<slug>.md` para resolver el issue #<N>: «<título del issue>». Qué archivos tocás, qué chequeos corrés después, cómo cumple los criterios. **No implementes todavía.**

   (`skills/design.md` para UI, `skills/testing.md` para tests, `skills/database.md` para datos.)

2. **Revisá el plan** que escribió en `prompts/`. ¿Toca los archivos correctos? ¿Se mete donde no debe? ¿Cubre lo que pide el issue?
   - Si está bien: respondé **`✓ Aprobado`**.
   - Si no: **`✕ Cambiar <qué>`** y vuelve al punto 2.

3. **Claude implementa** el plan aprobado.

4. **Claude corre los chequeos** y te da los pasos exactos para probarlo a mano.

5. **Probá vos** (levantás la app, mirás la pantalla / corrés los tests). Si algo no cierra, decíselo a Claude y ajusta.

El `prompts/<NN>-<slug>.md` queda commiteado junto con el código — es el registro de qué se hizo y por qué.

---

## 3b. Resolver — tarea de decisión o documentación  (`tipo:decision`, `tipo:doc`)

No hay código ni chequeos, pero igual queda por escrito en el repo.

1. Leé el archivo de contexto del issue + lo que haga falta para decidir (migraciones reales en `supabase/migrations/`, el código actual, la base en vivo).
2. Redactá la decisión / el documento. Podés pedirle a Claude Code que lo escriba y vos lo revisás:
   > Leé `<archivos de contexto>`. Redactá `<archivo destino>` con la decisión sobre «<tema del issue>», con los fundamentos.
3. Si la decisión **desbloquea otras tarjetas** (p. ej. las 4 decisiones del modelo de datos), anotá en la Nota de cada tarjeta bloqueada que ya está resuelta, y avisá en el grupo.

---

## 4. Chequeos (antes de subir)

Corré **todos** los que apliquen a tu repo (ver tabla del final). Si alguno falla, se arregla antes de subir.

```bash
# web
npm run lint && npm run build

# mobile
npm run lint && npx tsc --noEmit
```

Tareas de solo-documentación no tienen chequeos: pasá directo al punto 5.

---

## 5. Commit + push

```bash
git status                      # mirá qué cambió — que no se cuele nada raro
git add <archivos>              # agregá solo lo tuyo (evitá 'git add .' a ciegas)
git commit -m "<tipo>: <qué hiciste>"
git push -u origin <tu-rama>
```

Mensaje de commit: imperativo, corto, en el mismo formato que el repo:
- `docs: decisión de roles para mobile (educador → Equipo Tecnico)`
- `feat: pantalla de alta de novedades (F2)`
- `test: criterios CA-01 a CA-07 de F1`

---

## 6. Pull Request

```bash
gh pr create --base <principal> --fill
```

o desde la web del repo (botón *Compare & pull request*). En el PR:

- **Título:** igual que el commit principal.
- **Descripción:** una línea de qué hace + `Closes #<N>` (así el issue se cierra solo al mergear).
- **Reviewers:** Jordy (y quien más corresponda: Meli si es algo testeable, Cami si toca UI).

---

## 7. Review y merge

1. **Jordy revisa** el PR: mira el diff, corre los chequeos si hace falta, deja comentarios.
   - Cambios pedidos → los hacés en la misma rama, `commit` + `push`, el PR se actualiza solo.
   - Aprobado → **Jordy mergea** (`Squash and merge`) y borra la rama.
2. Mientras esperás review, movés la tarjeta a **`En revisión`**.

---

## 8. Cerrar la tarjeta

Cuando el PR se mergeó:

- El issue se cierra solo (si pusiste `Closes #N`).
- Movés la tarjeta a **`Hecha`**.
- Borrás tu rama local:
  ```bash
  git checkout <principal>
  git pull
  git branch -d <tu-rama>
  ```

---

## 9. Empezar la próxima

```bash
git checkout <principal>
git pull                        # ya traés lo que acabás de mergear + lo de los demás
```

Volvés al punto **1**: elegís la próxima tarjeta de tu columna, la pasás a `En curso`, y repetís.

---

## Si te bloqueás

1. Movés la tarjeta a **`Bloqueada`**.
2. En la **Nota**: qué te frena y de quién/qué depende (p. ej. *"depende de la decisión #3 — arquitectura de datos"*).
3. Avisás en el grupo.
4. Agarrás otra tarjeta tuya que no dependa de eso.

En la **revisión semanal** (lunes, 10 min, vista Tabla) se repasan todas las `En curso` y `Bloqueada` y se destraban.

---

## Web vs mobile — diferencias

| | **web** (`cielo-abierto`) | **mobile** (`arguello-infancias-mobile`) |
|---|---|---|
| Carpeta local | `arguello-infancias/` | `mobile/` |
| Rama principal | `master` | `main` |
| Stack | Next.js 16 + Supabase | Expo SDK 57 + React Native |
| Levantar | `npm run dev` → `localhost:3000` | `npx expo start` → Expo Go / `w` |
| Chequeos | `npm run lint` · `npm run build` | `npm run lint` · `npx tsc --noEmit` |
| Planes en | `prompts/NNN-nombre.md` (3 dígitos) | `prompts/NN-nombre.md` (2 dígitos) |
| Skills | `.claude/skills/*.skill.md` | `skills/design.md`, `testing.md`, `database.md` |
| Reglas | `AGENTS-WEB.md` | `AGENTS.md` |

> En mobile **no existe** `npm run typecheck` (aunque `AGENTS.md` lo menciona) — usá `npx tsc --noEmit`.

---

## Errores comunes

- ❌ Empezar a implementar sin plan aprobado. → Siempre PLAN primero.
- ❌ `git add .` y commitear archivos que no son tuyos (o `.env`, `node_modules`). → `git status` y agregá selectivo.
- ❌ Trabajar sobre `master`/`main` directo. → Rama por tarjeta.
- ❌ Dos personas en el mismo archivo. → Coordinen en el grupo; una rama por tarjeta reduce el choque.
- ❌ Dejar la tarjeta en `Sin empezar` mientras trabajás. → Movela a `En curso` al arrancar.
- ❌ Mergear sin correr los chequeos. → `lint` + `build`/`tsc` antes del PR.
