# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Dirección (rol `Admin`)**: conduce la residencia. Carga y aprueba lo institucional (usuarios, autorizaciones de retiro, informe SENAF, verificación manual de identidad) y lee el registro de auditoría.
- **Equipo Técnico (rol `Equipo Tecnico`)**: psicólogos, trabajadores sociales, abogados y educadores. Llevan el día a día de cada NNyA: legajos, intervenciones, salud, incidentes, turnos, retiros.
- Uso principal: **PC de oficina**, en sesiones largas de carga y consulta de legajos e informes (confirmado el 22/10/2026).

## Product Purpose

Sistema de gestión de una residencia de NNyA (niños, niñas y adolescentes) bajo protección judicial en Córdoba, Argentina. Reemplaza planillas Excel/Word y registros en papel por un registro trazable desde el ingreso hasta el egreso, con alertas sobre eventos críticos. El éxito es que la seguridad de cada NNyA no dependa de la memoria de una persona: que cada decisión quede registrada, con autor, y que lo crítico no se pierda.

## Positioning

La autorización y la trazabilidad viven en la base de datos, no en la pantalla: permisos por rol (RLS), reglas de negocio en la base y un registro de auditoría inmutable por triggers. Los retiros exigen identidad verificada contra RENAPER (vía Didit) más una autorización vigente cargada por Dirección.

## Operating Context

- Procesos: ingreso y admisión, evaluación integral, acompañamiento diario, salud, egreso y seguimiento post-egreso, coordinación institucional (audiencias judiciales, tutela, referentes), evaluación institucional. Detalle en `documentacion/procesos-del-negocio.md` (carpeta del equipo).
- Retiros: el operador inicia el retiro en la PC, el adulto lee el consentimiento en esa pantalla y verifica su identidad escaneando un QR con su propio celular.
- Existe una app móvil aparte (`mobile/`) que comparte base, cuentas y roles; este documento cubre la web.
- Es el proyecto de tesis del equipo; se demuestra en producción con datos ficticios marcados "DEMO".

## Capabilities and Constraints

- Stack existente: Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4 con tokens en `app/globals.css` (`@theme`, sin `tailwind.config.*`), primitivas shadcn/Radix en `components/ui/`, TanStack Query, react-hook-form + zod, recharts, lucide-react. No agregar dependencias sin justificarlo.
- Dos roles únicamente: `Admin` y `Equipo Tecnico`. La UI oculta lo que el rol no puede hacer (`AccessGuard`), pero la garantía es RLS.
- Datos sensibles: DNI, salud, ubicación, situación judicial de menores. El acceso se restringe por rol desde el diseño de cada pantalla.
- Fuera de alcance: gestión de recursos, fondos, stock y asistencia de personal.
- Terminología del dominio: NNyA, legajo, intervención, referente, vínculo de tutela, autorización de retiro, egreso, SENAF, RENAPER.
- Sin decidir: sistema de diseño de la web (rediseño visual en curso, 22/10/2026; issue #31).

## Brand Commitments

Ninguno obligatorio (confirmado el 22/10/2026): la paleta y las fuentes actuales no son identidad fija. El nombre es "Argüello Infancias".

## Evidence on Hand

- Datos reales de NNyA: sensibles, nunca se usan en maquetas, capturas ni ejemplos.
- Datos de demostración en producción: NNyA "Lucía Prueba DEMO", tutora "Ana Prueba DEMO", referente "Gabriela Referente DEMO" (DNI ficticios 99000001, 99000011, 99000021).
- Mockups previos de Stitch en `docs/pantallas stitch/` (referencia opcional, no vinculante). Catálogo del sistema actual en `docs/design-system.md`.
- No hay logo, fotografías ni testimonios: no inventarlos.

## Product Principles

1. **La seguridad del NNyA primero.** Ante un tradeoff entre rapidez y seguridad, gana la seguridad.
2. **Todo deja rastro.** Cada acción relevante muestra quién la hizo y cuándo; nada crítico se resuelve "de palabra".
3. **Mostrar solo lo que el rol necesita.** Lo sensible se ve por permiso, no por defecto.
4. **Simple antes que completo.** Reemplaza planillas para personas que no son técnicas: sin sobrecarga ni funciones "por si acaso".
5. **No afirmar lo que el sistema no hace.** La interfaz y los textos describen el comportamiento real.
