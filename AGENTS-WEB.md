# AGENTS-WEB.md

**Sistema de Gestión de Residencia — Versión WEB**

> Lee primero **AGENTS.md** para entender el contexto general, principios y seguridad compartida.

---

## 🎯 Propósito Web

La versión **WEB** es el sistema principal para **gestión institucional** de la residencia.

**Usuarios:** Admin, Técnicos, Psicología, Trabajo Social, Dirección, Administración

**Responsabilidades:**
- Gestión integral de NNA (admisión, evaluaciones, cambios de estado)
- Legajos digitales (fichas, informes, documentos)
- Evaluaciones (psicológica, educativa, sanitaria, social)
- Reportes institucionales
- Auditoría y trazabilidad
- Gestión de usuarios y permisos

---

## 🏗️ Arquitectura Web

```
┌─────────────────────────────────────┐
│   NAVEGADOR (Cliente)               │
│  Next.js 14 + React 18 + Tailwind   │
│  - UI responsiva                    │
│  - Datos temporales                 │
│  - NO datos sensibles en RAM        │
└──────────────┬──────────────────────┘
               │ HTTPS + JWT + CSRF Token
               ▼
┌─────────────────────────────────────┐
│  NODE.JS + EXPRESS (Servidor)       │
│  - Autenticación (Passport + MFA)   │
│  - Validación zod                   │
│  - Cifrado/Descifrado               │
│  - Auditoría antes de guardar       │
│  - RBAC middleware                  │
└──────────────┬──────────────────────┘
               │ SSL + Credenciales
               ▼
┌─────────────────────────────────────┐
│  PostgreSQL (Supabase)              │
│  - Datos cifrados en reposo         │
│  - RLS policies                     │
│  - Audit log immutable              │
└─────────────────────────────────────┘
```

---

## 🛠️ Stack Web Específico

### Frontend

```
- Next.js 14+
- React 18 (server components where possible)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- TanStack Query (data fetching + caching)
- Zustand (global state)
- Supabase Auth
- Axios (HTTP client)
```

### Backend

```
- Node.js 20+
- Express.js + TypeScript
- Passport.js (authentication strategies)
- JWT (tokens)
- speakeasy (TOTP/MFA)
- bcryptjs (password hashing)
- crypto-js (AES-256 encryption)
- zod (schema validation)
- winston (logging)
- helmet (security headers)
- express-rate-limit (rate limiting)
```

### Base de Datos

```
- PostgreSQL 15+
- Supabase (managed hosting)
- pgcrypto extension (encryption)
- RLS policies (row-level security)
```

---

## 📊 Modelo de Datos Web

### Tablas Principales (Compartidas)

Ver **AGENTS.md** para tablas base:
- `users`
- `minors`
- `daily_tasks`
- `daily_observations`
- `medications`
- `audit_log`

### Tablas Específicas Web

**`minor_evaluations`** — Fichas de evaluación
```sql
id (UUID) — PRIMARY KEY
minor_id (UUID) — FK minors(id)
evaluation_type (VARCHAR 50) — psicológica | educativa | sanitaria | social
evaluator_id (UUID) — FK users(id)
evaluation_date (DATE)
content (TEXT) — contenido de evaluación
recommendations (TEXT)
status (VARCHAR 50) — completed | pending
created_at (TIMESTAMP)
updated_at (TIMESTAMP)

ÍNDICES: (minor_id), (evaluation_type), (evaluation_date)
```

**`medical_appointments`** — Turnos médicos
```sql
id (UUID) — PRIMARY KEY
minor_id (UUID) — FK minors(id)
appointment_date (DATE)
appointment_time (TIME)
specialty (VARCHAR 100)
medical_center (VARCHAR 255)
reason (TEXT)
attended (BOOLEAN)
observations (TEXT)
follow_up_required (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)

ÍNDICES: (minor_id), (appointment_date)
```

**`system_reports`** — Reportes generados
```sql
id (UUID) — PRIMARY KEY
report_type (VARCHAR 50) — seguimiento | evaluación | egreso | estadísticas
generated_by (UUID) — FK users(id)
report_date (DATE)
content (TEXT) — reporte formateado
format (VARCHAR 20) — html | pdf | json
created_at (TIMESTAMP)

ÍNDICES: (report_type), (generated_by)
```

---

## 🔐 Seguridad Web Específica

### Obligatorios en Web

- ✅ **MFA en login** (TOTP via speakeasy)
- ✅ **Session management** (JWT + httpOnly cookies)
- ✅ **CSRF tokens** en formularios
- ✅ **Rate limiting** en endpoints sensibles
- ✅ **CORS configurado** (solo dominios autorizados)
- ✅ **Helmet.js** (headers de seguridad)
- ✅ **Input sanitization** (zod + DOMPurify)
- ✅ **Error handling** (nunca exponer stack traces)
- ✅ **Timeouts** (15-30 min inactividad)

### Headers de Seguridad (Helmet)

```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: restrictive
```

### Endpoints Protegidos

Todos los endpoints requieren:
```typescript
Authorization: Bearer <JWT>
```

Sin JWT válido → 401 Unauthorized

---

## 🔌 Endpoints API (Backend)

### Autenticación

```
POST /api/auth/login
  Body: { email, password }
  Response: { access_token, refresh_token, user }
  MFA Challenge: { mfa_required: true, session_token }
  Status: 200 | 401 | 429

POST /api/auth/mfa/verify
  Body: { session_token, mfa_code }
  Response: { access_token, refresh_token }
  Status: 200 | 401

GET /api/auth/me
  Response: { id, email, name, role, permissions }
  Status: 200 | 401

POST /api/auth/logout
  Response: { success: true }
  Status: 200
```

### Menores (NNA)

```
GET /api/minors
  Query: ?status=active&sort=admission_date
  Response: { data: [{id, first_name, dni, status, ...}], total, page }
  RBAC: admin, technician
  Status: 200

GET /api/minors/:id
  Response: { id, first_name, last_name, dni, birthdate, ... }
  Auditoría: registra VIEW (quién vio qué)
  Status: 200 | 404

POST /api/minors
  Body: { first_name, last_name, dni, birthdate, admission_date, ... }
  Validación: DNI único, fecha válida, responsable válido
  Response: { id, created_at }
  RBAC: admin, technician
  Auditoría: registra INSERT con new_values
  Status: 201 | 400 | 403

PATCH /api/minors/:id
  Body: { fields a actualizar }
  Auditoría: registra UPDATE con old/new_values
  Response: { id, updated_at }
  Status: 200 | 403 | 404

PATCH /api/minors/:id/status
  Body: { status: "egressed", egress_date, egress_reason }
  Auditoría: registra EGRESO como acción especial
  Response: { id, status, egress_date }
  Status: 200 | 403
```

### Evaluaciones

```
GET /api/minors/:id/evaluations
  Query: ?type=psicológica
  Response: { data: [{id, type, evaluator, date, content, ...}] }
  Status: 200

POST /api/minors/:id/evaluations
  Body: { evaluation_type, content, recommendations }
  RBAC: technician, admin
  Auditoría: registra INSERT
  Response: { id, created_at }
  Status: 201 | 403

GET /api/minors/:id/evaluations/:eval_id
  Response: { evaluación completa }
  Auditoría: registra VIEW
  Status: 200

PATCH /api/minors/:id/evaluations/:eval_id
  Body: { content, recommendations, status }
  RBAC: evaluator (quien la creó), admin
  Response: { id, updated_at }
  Status: 200 | 403
```

### Tareas Diarias

```
GET /api/minors/:id/tasks
  Query: ?date=2025-01-20&status=pending
  Response: { data: [{id, type, assigned_to, status, ...}] }
  Status: 200

POST /api/minors/:id/tasks
  Body: { assigned_to, task_type, description, task_date }
  RBAC: admin, technician, educator
  Response: { id, created_at }
  Status: 201 | 403

PATCH /api/tasks/:id
  Body: { status: "completed", notes: "..." }
  RBAC: educator (asignada a ti), admin
  Auditoría: quién completó, cuándo
  Response: { id, status, completed_at }
  Status: 200 | 403
```

### Observaciones

```
GET /api/minors/:id/observations
  Query: ?days=30
  Response: { data: [{date, reported_by, content, category, mood}] }
  Status: 200

POST /api/minors/:id/observations
  Body: { content, category, mood_level, incidents, positive_events }
  RBAC: educator, technician, admin
  Auditoría: registra observación
  Response: { id, created_at }
  Status: 201 | 403
```

### Medicación

```
GET /api/minors/:id/medications?active=true
  Response: { data: [{id, name, dosage, frequency, active}] }
  Status: 200

POST /api/minors/:id/medications
  Body: { medication_name, dosage, frequency, start_date, prescribed_by }
  RBAC: technician (médico), admin
  Response: { id, created_at }
  Status: 201 | 403

GET /api/minors/:id/medications/:med_id/log?days=7
  Response: { data: [{date, time, administered_by, given, notes}] }
  Auditoría: acceso crítico a log de medicación
  Status: 200

POST /api/minors/:id/medications/:med_id/administer
  Body: { administered_time, given, notes }
  RBAC: educator, technician, admin
  Auditoría: registra administración
  Response: { id, log_entry_created }
  Status: 201 | 403
```

### Turnos Médicos

```
GET /api/minors/:id/appointments?upcoming=true
  Response: { data: [{id, date, time, specialty, center, attended}] }
  Status: 200

POST /api/minors/:id/appointments
  Body: { appointment_date, appointment_time, specialty, medical_center, reason }
  RBAC: technician, admin
  Response: { id, created_at }
  Status: 201 | 403

PATCH /api/minors/:id/appointments/:apt_id
  Body: { attended, observations, follow_up_required }
  RBAC: educator, technician, admin
  Auditoría: registra asistencia a turno
  Response: { id, updated_at }
  Status: 200 | 403
```

### Dashboard (Admin/Técnico)

```
GET /api/dashboard
  Response: {
    total_minors: int,
    active_minors: int,
    recent_admissions: [{...}],
    pending_evaluations: int,
    upcoming_appointments: [{...}],
    pending_tasks: [{...}],
    alerts: [{severity, message, minor_id}]
  }
  RBAC: admin, technician
  Status: 200
```

### Auditoría (Admin only)

```
GET /api/audit
  Query: ?table=minors&user_id=X&days=30&page=1
  Response: { data: [audit_entries], total, page }
  Campos: table_name, record_id, action, user_email, timestamp, ip_address, status
  NO retorna: new_values/old_values (demasiado sensible en este endpoint)
  RBAC: admin solo
  Status: 200 | 403

GET /api/audit/:log_id
  Response: { ...audit_entry_completo con new_values/old_values }
  RBAC: admin solo
  Status: 200 | 403 | 404
```

### Reportes

```
POST /api/reports/generate
  Body: { report_type, start_date, end_date, minor_id (opcional), format }
  Response: { report_id, status, url (si PDF/HTML) }
  RBAC: admin, technician
  Auditoría: registra generación de reporte
  Status: 201 | 403

GET /api/reports/:report_id
  Response: { contenido del reporte }
  Status: 200 | 404
```

---

## 🎨 Estructura Frontend

### Carpetas Principales

```
web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── mfa/page.tsx
│   │   └── logout/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── minors/
│   │   ├── evaluations/
│   │   ├── appointments/
│   │   ├── tasks/
│   │   ├── observations/
│   │   ├── medications/
│   │   ├── audit/
│   │   └── reports/
│   └── layout.tsx
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── minors/
│   ├── ui/ (shadcn components)
│   └── common/
├── hooks/
│   ├── useAuth.ts
│   ├── useMinors.ts
│   ├── useEvaluations.ts
│   └── ...
├── lib/
│   ├── api-client.ts (axios + interceptors)
│   ├── auth.ts (JWT helpers)
│   └── encryption.ts (client-side crypto)
├── services/
│   ├── minorService.ts
│   ├── evaluationService.ts
│   ├── authService.ts
│   └── ...
├── types/
│   ├── minor.ts
│   ├── user.ts
│   ├── evaluation.ts
│   └── ...
├── styles/
│   └── globals.css (Tailwind config)
└── utils/
    ├── formatters.ts
    ├── validators.ts
    └── ...
```

### Componentes Comunes

```
Button (primario, secundario, danger)
Card (contenedor)
Dialog (modal)
Form (form builder)
Input (text, email, number, date)
Select / MultiSelect
Table (datos tabulares)
Alert (mensajes)
Loading (skeleton)
Empty State
Sidebar (navegación)
```

---

## 🔄 Flujos Principales Web

### 1. Ingreso de un NNA

```
Usuario (Admin/Técnico) en Dashboard
  ↓
Click "Nuevo Menor"
  ↓
Formulario: datos básicos, DNI, residente, obra social, contacto emergencia
  ↓
Validación cliente (formato DNI, fecha válida, etc.)
  ↓
POST /api/minors (con Authorization header)
  ↓
Backend valida (zod), verifica DNI único, hasha datos sensibles, cifra
  ↓
Auditoría registra: INSERT minors (user, timestamp, ip)
  ↓
Respuesta: { id: new_minor_id }
  ↓
Redirect a /minors/:id
  ↓
Mostrar legajo del nuevo NNA (lectura)
```

### 2. Registrar Evaluación

```
Usuario abre ficha de NNA → Tab "Evaluaciones"
  ↓
Click "Nueva Evaluación" → Selecciona tipo (psic, educ, sanitaria, social)
  ↓
Formulario: contenido (textarea), recomendaciones
  ↓
POST /api/minors/:id/evaluations
  ↓
Backend: valida tipo, crea registro, audita
  ↓
Auditoría: INSERT minor_evaluations
  ↓
Refresh lista de evaluaciones
```

### 3. Egreso de un NNA

```
Usuario abre ficha → Tab "Estado"
  ↓
Click "Egresar menor"
  ↓
Formulario: fecha de egreso, motivo, referente
  ↓
PATCH /api/minors/:id/status
  ↓
Backend: verifica permisos (admin/tech), marca status = "egressed"
  ↓
Auditoría especial: EGRESO (quién, cuándo, motivo)
  ↓
Archiva minor de lista activa
  ↓
Inicia protocolo post-egreso (si aplica)
```

### 4. Generar Reporte

```
Usuario en Dashboard → Tab "Reportes"
  ↓
Formulario: tipo reporte, fecha inicio/fin, filtros
  ↓
POST /api/reports/generate
  ↓
Backend: arma SQL, genera contenido, exporta formato (PDF/HTML/JSON)
  ↓
Auditoría: REPORT_GENERATED (quién, tipo, datos utilizados)
  ↓
Respuesta: URL del reporte
  ↓
Usuario descarga/visualiza
```

---

## 🧪 Testing Web

### Tipos de Tests

- **Unit**: lógica en servicios, utils (Jest)
- **Integration**: endpoints + BD (Jest + Supertest)
- **E2E**: flujos usuario completos (Cypress o Playwright)

### Coverage Mínimo

- Autenticación (login, MFA, logout)
- RBAC en endpoints (admin vs tech vs educador)
- Validación de inputs (DNI, fechas, etc.)
- Auditoría se registra correctamente
- Cifrado/descifrado de datos sensibles
- Manejo de errores (404, 500, etc.)

---

## 📝 Estándares Código Web

### Funciones

- Max 20 líneas
- Una responsabilidad
- Tipos explícitos

### Componentes React

- Props tipadas con TypeScript
- Usar hooks custom para lógica
- Evitar lógica de negocio en el componente

### Servicios

- Una clase = una entidad (MinorService, etc.)
- Métodos CRUD simples
- Llamadas a API centralizadas

### Manejo de Errores

```typescript
try {
  const response = await minorService.create(data);
  return response;
} catch (error) {
  if (error instanceof ValidationError) {
    // validación fallida → mostrar mensaje
  } else if (error instanceof AuthError) {
    // no autorizado → logout
  } else {
    // error inesperado → log + mostrar genérico
    logger.error('Error creating minor', error);
  }
}
```

---

## 🚀 Deploy Web

### Frontend (Vercel)

```bash
npm run build
vercel deploy
```

### Backend (Railway)

```bash
npm run build
railway deploy
```

### BD (Supabase)

```
- Auto backups
- Restore points
- Replication si aplica
```

---

## ⚠️ Checklist Antes de Deploy

- [ ] npm run build (sin errores)
- [ ] npm run test (100% pass)
- [ ] npm run lint (0 warnings)
- [ ] Secrets en .env (NUNCA en código)
- [ ] CORS configurado (solo dominios autorizados)
- [ ] Rate limiting activo
- [ ] Auditoría funciona
- [ ] MFA habilitado
- [ ] Datos sensibles cifrados
- [ ] Backups automáticos

---

## 🔗 Referencias

Lee también:
- **AGENTS.md** — Contexto general
- **AGENTS-MOBILE.md** — Versión mobile (si quieres ver comparación)
- **PROCESOS-OPERATIVOS.md** — Detalle de los 9 procesos
- **README.md** — Setup + instalación

---

**La versión WEB es la gestión integral. Desarrolla Feature por Feature, valida permisos en cada endpoint, audita todo.**

¿Siguiente paso? Elige una Feature de los procesos 1.1-1.9 y escribe un prompt en `prompts/`.
