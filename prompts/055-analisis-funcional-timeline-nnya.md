# 055 - Análisis funcional del timeline cronológico por NNyA (Innovación 2)

**Tarjeta:** jordydev1993/cielo-abierto#20 — Innovación 2: análisis funcional del timeline por NNyA (labels area:modelo-datos, tipo:doc; asignada a Meli el 15/10).
**Implementación posterior:** jordydev1993/cielo-abierto#45 — Innovación 2: implementar el timeline visual en la ficha del NNyA (a cargo de Jordy).
**Referencia UI existente (reutilizar):** components/entities/nnya/TimelineNnyaDemo.tsx (presente en master, debe reutilizarse como referencia para #45; NO modificar).
**QA:** Meli, contra los criterios de aceptación de § 11, cuando #45 esté implementado.
**Tipo de plan:** análisis funcional + datos. No implementa código, no crea schema, no toca migraciones ni cambia RLS.
**Responsable del análisis:** Meli.
**Estado:** borrador — pendiente de aprobación de Jordy.
**Fecha:** 16/10/2026 (actualizado tras revisión de Jordy).

## 1. Alcance
**Qué entra:** lista cerrada de eventos sobre 9 dominios, fuente/fecha/hora, texto corto, minimización, sensibilidad, permisos/RLS, orden, NULL, filtros, ubicación, criterios, separación Próximos/Historial, condiciones por estado.
**Qué NO entra:** implementación (#45), resumen IA, schema/migraciones/RLS, dominios fuera de los 9, tipo de egreso (D-18), timeline mobile, detalle/expansión.

## 2. Fuente de cada evento
| # | Evento | Tabla | Columna de fecha | Tipo | ¿Tiene hora? | Nulabilidad |
|---|---|---|---|---|---|---|
| 1 | Legajo abierto | legajos | fecha_apertura | DATE | No | NOT NULL |
| 2 | Legajo cerrado | legajos | fecha_cierre | DATE | No | NULL |
| 3 | Intervención registrada | intervenciones | fecha | DATE | No | NOT NULL |
| 4 | Incidente registrado | incidentes | fecha_hora | TIMESTAMPTZ | Sí | NOT NULL |
| 5 | Diagnóstico registrado | diagnosticos | fecha_diagnostico | DATE | No | NOT NULL |
| 6 | Medicación iniciada | medicamentos | fecha_inicio | DATE | No | NOT NULL |
| 7 | Medicación finalizada | medicamentos | fecha_fin | DATE | No | NULL |
| 8 | Audiencia judicial | audiencias_judiciales | fecha_hora | TIMESTAMPTZ | Sí | NOT NULL |
| 9 | Vínculo de tutela iniciado | vinculos_tutela | vigente_desde | DATE | No | NOT NULL |
| 10 | Vínculo de tutela finalizado | vinculos_tutela | vigente_hasta | DATE | No | NULL |
| 11 | Egreso | nnya (columna) | fecha_egreso | DATE | No | NULL |
| 12 | Seguimiento post-egreso programado | seguimiento_post_egreso | fecha_programada | DATE | No | NOT NULL |
| 13 | Contacto de seguimiento realizado | seguimiento_post_egreso | fecha_contacto | TIMESTAMPTZ | Sí | NULL |

Notas: filtrar por nnya_id. No usar created_at/updated_at. No inventar horas para DATE.

## 3. Eventos concretos
1. Legajo abierto/cerrado según corresponda (§4.1)
2. Intervención registrada (intervenciones.tipo es texto libre — NO mostrar)
3. Incidente registrado
4. Diagnóstico registrado
5. Medicación iniciada / finalizada (separada si fecha_fin IS NOT NULL; si futura ? Próximos)
6. Audiencia judicial (ver estados)
7. Vínculo de tutela iniciado/finalizado (solo estados válidos; tipo NO mostrado)
8. Egreso
9. Seguimiento post-egreso programado / Contacto realizado (solo con fecha_contacto IS NOT NULL)

## 4. Estado del registro / condiciones por evento
Principio: la fecha no implica que ocurrió. Inspeccionar types/database.generated.ts, migraciones y código; si incierto ? marcar pendiente.

| Evento | Fecha funcional | Condición de estado | Texto mínimo |
|---|---|---|---|
| Legajo abierto/cerrado | fecha_apertura / fecha_cierre | Validar reglas de estado/cierre. Solo generar cerrado si corresponde. | Legajo abierto / Legajo cerrado |
| Vínculo tutela iniciado | vigente_desde | NO generar si estado = 'propuesto'. Diferenciar revocado vs finalizado. NO mostrar tipo. | Vínculo de tutela iniciado |
| Vínculo tutela finalizado | vigente_hasta | Solo para estados válidos (D-2 aprobado con condición). | Vínculo de tutela finalizado |
| Audiencia judicial | fecha_hora | Estados reales: programada/realizada/suspendida/cancelada. NO presentar cancelada/suspendida como ocurridas. | Audiencia judicial (puede mostrar estado) |
| Medicación iniciada/finalizada | fecha_inicio / fecha_fin | Finalizada separada si IS NOT NULL. Futura ? Próximos. | Medicación iniciada / Medicación finalizada |
| Seguimiento | fecha_programada / fecha_contacto | Contacto solo con fecha_contacto IS NOT NULL (D-7). Sin fecha ? sin evento. | Según corresponda |

## 5. Texto corto y minimización
- intervenciones.tipo: eliminado (texto libre) — NO mostrar
- tipo de tutela: NO mostrar (puede revelar contexto familiar/judicial)
- Prohibidos: descripción, observaciones, carátula/expediente/juzgado/resultado, motivo_cierre/motivo_finalizacion, nombre/dosis/frecuencia/vía/prescriptor, tipo clínico, resoluciones, salud/terapias/escolaridad detallados, metadatos de auditoría.

## 6. Sensibilidad
SALUD / JUDICIAL / Administrativa. Todos visibles si RLS lo permite, con minimización.

## 7. Próximos vs Historial y orden
- Próximos: fecha funcional > fecha actual. Historial: <= fecha actual. Futuros nunca como pasados.
- Orden descendente dentro de cada sección.
- Mismo día: primero con hora real (hora DESC). Luego DATE sin hora, de lo más reciente a lo más viejo (D-5). Ajustar prioridad determinista sin mezclar direcciones.
- Sin horas ficticias, sin created_at. Desempate por tipo ajustado + id ASC.

## 8. Fechas faltantes / NULL
NULL no genera evento. fecha_contacto NULL con contacto_realizado true ? sin evento.

## 9. Permisos
Admin/Equipo Tecnico, respeta RLS vigente. Sin bypass.

## 10. Filtros
8 filtros: Todos, Legajo, Intervenciones, Incidentes, Salud, Judicial, Egreso, Seguimiento. Filtro por período fuera de esta versión (D-6).

## 11. Ubicación
app/(dashboard)/nnya/[id]/page.tsx. Reutilizar components/entities/nnya/TimelineNnyaDemo.tsx como referencia para #45 (sin modificarlo).

## 12. Decisiones Jordy
D-1 APROBADA | D-2 APROBADA CON CONDICIÓN | D-3 APROBADA (sin tipo tutela, sin intervenciones.tipo, puede mostrar estado audiencia) | D-4 APROBADA | D-5 MODIFICADA Y APROBADA (DATE más reciente primero) | D-6 APROBADA (sin filtro por período) | D-7 APROBADA (solo fecha_contacto)

## 13. Criterios de aceptación
- [ ] Separación Próximos/Historial correcta
- [ ] Futuros nunca como pasados
- [ ] tutela propuesto no como iniciado; revocado vs finalizado
- [ ] audiencia cancelada/suspendida no como realizada
- [ ] intervenciones.tipo NO mostrado; tipo tutela NO mostrado
- [ ] medicación finalizada evento separado si fecha_fin IS NOT NULL; futura ? Próximos
- [ ] tutela finalizada solo estados válidos
- [ ] contacto solo con fecha_contacto IS NOT NULL
- [ ] orden correcto según D-4/D-5
- [ ] solo 8 filtros, sin filtro por período
- [ ] TimelineNnyaDemo.tsx citado como referencia sin modificarlo
- [ ] Solo análisis funcional

## 14. Notas
Renombrado 043?055 (043-restaurar-validacion-manual-y-habilitar-vigente.md permanece en master). Sin duplicados.
