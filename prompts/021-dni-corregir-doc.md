# 021 — DNI: corregir documentación en vez de implementar cifrado

**Tarjeta:** [#11](https://github.com/jordydev1993/cielo-abierto/issues/11) — Jordy — Media

## Objetivo

Resolver la deuda documentada: `AGENTS-WEB.md` (y documentación vieja) afirmaban cifrado
AES-256 de `nnya.dni`/`tutores.dni`, pero son `varchar` plano. Decidir entre implementar
cifrado real o corregir la documentación.

## Decisión (Jordy)

**Corregir la documentación, no implementar cifrado.** Presenté el costo real de cifrar
antes de decidir:

- `pgp_sym_encrypt()` (pgcrypto) genera un ciphertext distinto en cada llamada (salt
  aleatorio) — mantener el `UNIQUE(dni)` que ya se usa para detectar duplicados exigiría
  agregar una columna de hash determinístico aparte, solo para unicidad/búsqueda exacta.
- Se pierde la búsqueda parcial por DNI que ya existe en las listas (`ReferenteTable`,
  `NnyaTable`, etc.) — no se puede `ILIKE` sobre datos cifrados.
- La clave de cifrado terminaría viviendo igual dentro de Postgres (pgcrypto corre en la
  base) — no protege contra alguien con acceso a la base, solo contra un dump/backup
  expuesto. Ganancia de seguridad limitada para el costo de reescribir 3 tablas
  (`nnya.dni`, `tutores.dni`, `referentes.dni`) + `validaciones_renaper.dni_consultado` y
  cada form/hook que las toca.

## Contexto

- `AGENTS-WEB.md` § Seguridad **ya era honesto**: tenía una nota admitiendo que el cifrado
  no está implementado (agregada en una sesión anterior). No había ninguna afirmación falsa
  activa ahí.
- Grep de `AES|cifrad|ENCRYPTED|encrypt` sobre todo `*.md` del repo: la única afirmación
  falsa sin matiz que quedaba activa era `docs/evolucion/00-RESUMEN-EJECUTIVO-FINAL.md`
  línea 227 (`✅ Cifrado AES-256` dentro de una sección "Compliance"). Es un documento
  histórico fechado "Enero 2025" — la especificación aspiracional pre-implementación, no la
  doc operativa.
- `docs/evolucion/03-PROMPTS-A0-A1-A2-DEFINITIVO-v2.md` menciona "cifrado" pero como
  instrucción condicional ("mismo tipo/cifrado que nnya.dni"), ya resuelta por
  `prompts/012` (que determinó que `nnya.dni` es texto plano) — no requiere corrección, no
  afirma que algo esté cifrado.

## Archivos modificados

- `docs/evolucion/00-RESUMEN-EJECUTIVO-FINAL.md`: nota al inicio del documento aclarando
  que es la spec aspiracional pre-implementación y remite a `AGENTS-WEB.md` como fuente de
  verdad; corrección inline en la línea del `✅ Cifrado AES-256`.
- `AGENTS-WEB.md`: § Seguridad reescrita para registrar la decisión (no solo admitir el
  gap); ítem `dni` movido de "Deuda conocida" a "Resuelto".

## Requisitos

- No se toca ningún schema ni código de aplicación — es un cambio de documentación puro.
- `pgcrypto` sigue instalado sin usar (no se desinstala, no hace daño quedarse disponible
  para el día que haga falta para otra cosa).

## Seguridad

- Sin cambios: `nnya.dni`/`tutores.dni`/`referentes.dni`/`validaciones_renaper.dni_consultado`
  siguen en texto plano, protegidos únicamente por RLS (acceso Admin/Equipo Tecnico), como
  ya estaba.

## Criterios de aceptación

- Ningún archivo `.md` del repo afirma que el DNI está cifrado sin la aclaración de que es
  una spec histórica no implementada.

## Chequeos

- No aplica (`npm run lint`/`build`/`tsc`) — cambio de documentación, no de código.

---

**Estado**: implementado.
