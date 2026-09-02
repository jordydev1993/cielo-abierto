# 📊 ARGÜELLO-INFANCIAS: PROYECTO COMPLETO (VERSIÓN FINAL)

**Fecha**: Enero 2025  
**Base**: 8 procesos del negocio validados con institución  
**Arquitectura**: 2 Fases (Core + Innovaciones)  
**Metodología**: Vibe Engineering (pequeños prompts aprobables)

---

## 🎯 Visión General

Argüello-Infancias es un sistema integral de gestión para residencias de menores bajo medidas de protección judicial en Argentina.

**Soporta completamente los 8 procesos operativos reales:**
1. ✅ Ingreso y Admisión
2. ✅ Evaluación Integral
3. ✅ Acompañamiento Diario
4. ✅ Salud
5. ✅ Egreso o Reintegración Familiar
6. ✅ Coordinación y Gestión Institucional
7. ✅ Registro y Trazabilidad
8. ✅ Evaluación Institucional

**Con 2 fases de implementación:**
- **Fase 1 (Core)**: 4-5 semanas, 8 procesos operativos 80%
- **Fase 2 (Innovaciones)**: 2-3 semanas, integraciones + valor agregado

---

## 📋 Estructura Final (Archivos Actualizados)

```
arguello-infancias-evolucion/
├── README.md (resumen ejecutivo - DESFASADO, ignorar)
├── 01-NUEVAS-FUNCIONALIDADES.md (actualizado para Opción A + 8 procesos)
├── 02-AGENTS-ACTUALIZADO.md (actualizado para 2 roles, 8 procesos)
├── 03-PROMPTS-EVOLUCION-ACTUALIZADO.md (15 prompts Fase 1)
├── 03b-PROMPTS-A1-A2-CORREGIDOS.md (A1-A2 corregidos con RENAPER)
├── 04-FASE1-FASE2-ARQUITECTURA.md ← NUEVO (arquitectura completa)
├── 05-FASE2-PROMPTS-E1-E8.md ← NUEVO (8 innovaciones Fase 2)
├── CHECKLIST-FINAL.md (actualizado)
└── procesos-del-negocio_copy.md (referencia: 8 procesos reales)
```

**Archivos a IGNORAR (desfasados):**
- 03-PROMPTS-EVOLUCION.md (viejo, tiene 10 roles)
- README.md (viejo)

---

## 🚀 FASE 1: Core del Sistema (4-5 semanas)

### Stack Técnico Confirmado
```
Frontend:   React 18 + TypeScript + Vite + Tailwind
Backend:    Next.js 16+ (fullstack)
BD:         PostgreSQL (Supabase managed)
Deploy:     Vercel (frontend) + Railway (si backend separado)
Autenticación: Supabase Auth + MFA (TOTP)
```

### Prompts Fase 1 (16 total)

#### BLOQUE A: Base (2 prompts)
```
A1:  CREATE TABLE (9 tablas nuevas)
     └─ recursos, gastos, inventario, asistencia_personal
        evaluacion_institucional, asistentes, casos
        propuestas_mejora, seguimiento_post_egreso

A1b: CREATE TABLE tutores + validación RENAPER
     └─ tabla tutores con dni_validado, fecha_validacion

A2:  RLS Policies (usando get_my_role() real)
     └─ 10 tablas con permisos admin/equipo
```

#### BLOQUE B: Gestión Administrativa (5 prompts)
```
B1:  Datos semilla (recursos, gastos, etc.)
B2:  Verificación auditoría
B3:  Components (UI)
B4:  Pages + rutas
B5:  Alertas automáticas (stock bajo, gasto sin comprobante)
```

#### BLOQUE C: Evaluación Institucional (5 prompts)
```
C1:  Datos semilla + verificación
C2:  Components (reunión, casos, propuestas)
C3:  Kanban de propuestas
C4:  Pages + rutas
C5:  Notificaciones automáticas
```

#### BLOQUE D: Seguimiento Post-Egreso (4 prompts)
```
D1:  Tabla + cron jobs (30-60-90 días)
D2:  Components + UI
D3:  Pages
D4:  Email automático + cron schedule
```

**Total: 16 prompts, 35-40 horas, 4-5 semanas**

### Tablas Creadas (9 + 1)
```
1. recursos (fondos por periodo)
2. gastos (con comprobante)
3. inventario (stock)
4. asistencia_personal (entrada/salida de equipo)
5. evaluacion_institucional (reunión mensual)
6. evaluacion_institucional_asistentes (tabla puente)
7. evaluacion_institucional_casos (casos revisados)
8. propuestas_mejora (acuerdos con responsables)
9. seguimiento_post_egreso (30-60-90 días)
+ tutores (validación RENAPER)
```

### Modelo de Acceso Confirmado
```
Roles: 'Admin' / 'Equipo Tecnico' (SIN granularizar)
Acceso: Amplio (consistente con 17 tablas actuales)
RLS: get_my_role() — patrón probado del proyecto
Auditoría: immutable audit_log en todas las tablas
```

### Validación RENAPER Integrada
```
Cuándo: Ingreso (Proceso 1.1) + Egreso (Proceso 1.5)
Qué valida: antecedentes + vigencia de DNI
Si rechaza: Bloquea el proceso (flujo claro)
Tabla: tutores con campos dni_validado, fecha_validacion
```

---

## 🎯 FASE 2: Innovaciones (2-3 semanas)

8 mejoras que agregan máximo valor post-core:

### E1: Integración de Calendarios (3-4h)
```
Crear reunión → notificación automática en Google Calendar
Cada asistente recibe invitación + recordatorio 24h
Beneficio: 0 olvidos de reuniones, 100% asistencia
```

### E2: Dashboard Predictivo (4-5h)
```
Métricas en tiempo real: NNyA activos, egresos, tasa éxito
Gráficos: tendencias, propuestas estado, riesgo
Beneficio: visibilidad ejecutiva, data-driven decisions
```

### E3: Reportería Automática SENAF (3-4h)
```
Trigger: fin de mes → PDF autogenerado
Contenido: casos activos, evaluaciones, egresos, propuestas
Beneficio: cumplimiento sin trabajo manual
```

### E4: Alertas Educativas (4-5h)
```
Ingreso manual + integración opcional con escuelas
Detectar ausencias, bajo desempeño
Notificación a Directora
Beneficio: detectar problemas de reinserción temprano
```

### E5: API para Externos (5-6h)
```
Endpoints read-only: SENAF, Juzgado, Escuela
Tokens de acceso con scope específico
Auditoría de todas las consultas
Beneficio: integración real con ecosistema
```

### E6: Workflow de Aprobaciones (3-4h)
```
Egreso: Directora → Abogado → Equipo → Confirmar
Evaluación: cierra solo si propuestas resueltas
Firmas digitales en BD
Beneficio: rigor legal + accountability
```

### E7: Timeline Visual (3-4h)
```
Ingreso → Evaluaciones → Hitos → Egreso
Visualización de trayectoria completa
Click en evento → detalles
Beneficio: visibilidad inmediata de estado
```

### E8: Cloud Storage (2-3h)
```
Documentos en AWS S3 / Google Drive
URLs con expiración
Auditoría de acceso
Beneficio: escalabilidad + seguridad
```

---

## 📊 Cobertura de Procesos

| Proceso | Descipción | Fase 1 | Fase 2 |
|---------|------------|--------|---------|
| 1.1 Ingreso | registro + PII + RENAPER | ✅ | — |
| 1.2 Evaluación | fichas + alertas | ✅ | E4 |
| 1.3 Acompañamiento | tareas + observaciones | ✅ | — |
| 1.4 Salud | medicación + turnos | ✅ | — |
| 1.5 Egreso | soft-delete + RENAPER + seguimiento | ✅ | E6 |
| 1.6 Coordinación | contactos + historial | ✅ | E5 |
| 1.7 Registro | auditoría + LPDP | ✅ | E8 |
| 1.8 Evaluación | reunión + propuestas + workflow | ✅ | E1+E6 |

**Resultado: 100% cobertura de procesos**

---

## 🔐 Compliance

```
✅ LPDP (Ley de Protección de Datos)
   - Auditoría inmutable
   - Cifrado AES-256
   - Derecho al olvido

✅ Ley 26.061 (Protección Integral de NNyA)
   - Datos de menores seguros
   - Acceso controlado

✅ Ley 9944 (Córdoba)
   - Procesos de residencia
   - Documentación clara

✅ Validación RENAPER
   - Tutores verificados
   - Antecedentes + vigencia
```

---

## 📈 Roadmap Temporal Completo

```
FASE 1 (Core):
├─ Semana 1-2: A1, A1b, A2 (base)
├─ Semana 2-3: B1-B5 (admin)
├─ Semana 3-4: C1-C5 (evaluación)
└─ Semana 4-5: D1-D4 (seguimiento)
Total: 35-40 horas, 4-5 semanas

FASE 2 (Innovaciones):
├─ Semana 1: E1, E2, E3
├─ Semana 2: E4, E5, E6
└─ Semana 3: E7, E8 + testing
Total: 30-35 horas, 2-3 semanas

PROYECTO COMPLETO: 65-75 horas, 6-8 semanas
```

---

## ✨ Qué Hace Diferente a Argüello-Infancias

```
1. BASADO EN PROCESOS REALES
   No es producto genérico. Está diseñado específicamente para
   los 8 procesos de residencias de menores bajo ley.

2. SEGURIDAD LEGAL
   LPDP + Ley 26.061 + Ley 9944 + RENAPER integrado.
   Auditoría inmutable desde día 1.

3. ACCESIBILIDAD
   2 roles simples (admin/equipo), sin complejidad innecesaria.
   Interfaces claras para cada proceso.

4. ESCALABILIDAD PLANIFICADA
   Fase 1 = core probado. Fase 2 = integraciones reales.
   Roadmap claro 6-8 semanas, no indefinido.

5. INNOVACIONES ÚTILES
   Calendarios, alertas, reportería automática.
   No son "nice-to-have", son necesarios para operación.
```

---

## 🎯 Próximo Paso: Mañana en Claude Code

```
1. Abre arguello-infancias en Claude Code
   cd arguello-infancias && code .

2. En Claude Code chat, pega Prompt A1
   (desde 03b-PROMPTS-A1-A2-CORREGIDOS.md)

3. Claude propone plan → TÚ apruebas → implementa

4. Sesión 1: 2-3 horas, 1 prompt, 9 tablas creadas
```

**Todo está listo. Decisiones confirmadas. Prompts corregidos. Arquitectura validada.**

🚀 **¿Comenzamos mañana?**

---

## 📁 Archivos Finales Listos

Descarga estos 6 desde `/outputs/`:

1. ✅ 03b-PROMPTS-A1-A2-CORREGIDOS.md (A1 + A1b + A2 listos)
2. ✅ 04-FASE1-FASE2-ARQUITECTURA.md (visión completa)
3. ✅ 05-FASE2-PROMPTS-E1-E8.md (innovaciones detalladas)
4. ✅ 02-AGENTS-ACTUALIZADO.md (reglas del proyecto)
5. ✅ 01-NUEVAS-FUNCIONALIDADES.md (tablas + flujos)
6. ✅ CHECKLIST-FINAL.md (guía ejecución)

**TODOS BASADOS EN:**
- ✅ 8 procesos reales (tu documento)
- ✅ Opción A (acceso amplio, sin restricción por legajo)
- ✅ 2 roles (admin/equipo)
- ✅ RENAPER integrado
- ✅ Fase 1 + Fase 2

---

**Confirmá y mañana arrancamos Prompt A1. 🚀**
