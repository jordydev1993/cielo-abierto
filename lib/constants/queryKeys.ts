export const queryKeys = {
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.roles.all, id] as const,
  },
  usuarios: {
    all: ['usuarios'] as const,
    lists: () => [...queryKeys.usuarios.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.usuarios.all, id] as const,
  },
  nnya: {
    all: ['nnya'] as const,
    lists: () => [...queryKeys.nnya.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.nnya.all, id] as const,
  },
  tutores: {
    all: ['tutores'] as const,
    lists: () => [...queryKeys.tutores.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.tutores.all, id] as const,
  },
  legajos: {
    all: ['legajos'] as const,
    lists: () => [...queryKeys.legajos.all, 'list'] as const,
    byNnya: (nnyaId: string) => [...queryKeys.legajos.all, 'nnya', nnyaId] as const,
    detail: (id: string) => [...queryKeys.legajos.all, id] as const,
  },
  nnyaTutores: {
    byNnya: (nnyaId: string) => ['nnya_tutores', nnyaId] as const,
  },
  alertas: {
    all: ['alertas'] as const,
    lists: () => [...queryKeys.alertas.all, 'list'] as const,
    pendientes: () => [...queryKeys.alertas.all, 'pendientes'] as const,
    byNnya: (nnyaId: string) => [...queryKeys.alertas.all, 'nnya', nnyaId] as const,
  },
  turnos: {
    all: ['turnos'] as const,
    lists: () => [...queryKeys.turnos.all, 'list'] as const,
    byLegajo: (legajoId: string) => [...queryKeys.turnos.all, 'legajo', legajoId] as const,
  },
  actividades: {
    all: ['actividades'] as const,
    lists: () => [...queryKeys.actividades.all, 'list'] as const,
  },
  incidentes: {
    all: ['incidentes'] as const,
    lists: () => [...queryKeys.incidentes.all, 'list'] as const,
    byLegajo: (legajoId: string) => [...queryKeys.incidentes.all, 'legajo', legajoId] as const,
  },
  intervenciones: {
    all: ['intervenciones'] as const,
    lists: () => [...queryKeys.intervenciones.all, 'list'] as const,
    byNnya: (nnyaId: string) => [...queryKeys.intervenciones.all, 'nnya', nnyaId] as const,
  },
  informes: {
    all: ['informes'] as const,
    lists: () => [...queryKeys.informes.all, 'list'] as const,
    byLegajo: (legajoId: string) => [...queryKeys.informes.all, 'legajo', legajoId] as const,
  },
  audiencias: {
    all: ['audiencias'] as const,
    byLegajo: (legajoId: string) => [...queryKeys.audiencias.all, 'legajo', legajoId] as const,
  },
  diagnosticos: {
    all: ['diagnosticos'] as const,
    byLegajo: (legajoId: string) => [...queryKeys.diagnosticos.all, 'legajo', legajoId] as const,
  },
  medicamentos: {
    all: ['medicamentos'] as const,
    byLegajo: (legajoId: string) => [...queryKeys.medicamentos.all, 'legajo', legajoId] as const,
  },
  documentos: {
    all: ['documentos'] as const,
    byLegajo: (legajoId: string) => [...queryKeys.documentos.all, 'legajo', legajoId] as const,
  },
  referentes: {
    all: ['referentes'] as const,
    lists: () => [...queryKeys.referentes.all, 'list'] as const,
  },
  vinculosTutela: {
    all: ['vinculos_tutela'] as const,
    byNnya: (nnyaId: string) => [...queryKeys.vinculosTutela.all, 'nnya', nnyaId] as const,
  },
  validacionesRenaper: {
    all: ['validaciones_renaper'] as const,
    ultimaByReferente: (referenteId: string) =>
      [...queryKeys.validacionesRenaper.all, 'ultima', referenteId] as const,
  },
  transferenciaAuh: {
    all: ['transferencia_auh'] as const,
    byVinculo: (vinculoId: string) => [...queryKeys.transferenciaAuh.all, 'vinculo', vinculoId] as const,
  },
  evaluacionInstitucional: {
    all: ['evaluacion_institucional'] as const,
    lists: () => [...queryKeys.evaluacionInstitucional.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.evaluacionInstitucional.all, id] as const,
  },
  evaluacionAsistentes: {
    all: ['evaluacion_institucional_asistentes'] as const,
    byEvaluacion: (evaluacionId: string) =>
      [...queryKeys.evaluacionAsistentes.all, 'evaluacion', evaluacionId] as const,
  },
  evaluacionCasos: {
    all: ['evaluacion_institucional_casos'] as const,
    byEvaluacion: (evaluacionId: string) =>
      [...queryKeys.evaluacionCasos.all, 'evaluacion', evaluacionId] as const,
  },
  propuestasMejora: {
    all: ['propuestas_mejora'] as const,
    lists: () => [...queryKeys.propuestasMejora.all, 'list'] as const,
    notificaciones: () => [...queryKeys.propuestasMejora.all, 'notificaciones'] as const,
  },
  turnosPersonal: {
    all: ['turnos_personal'] as const,
    lists: () => [...queryKeys.turnosPersonal.all, 'list'] as const,
  },
  seguimientoPostEgreso: {
    all: ['seguimiento_post_egreso'] as const,
    lists: () => [...queryKeys.seguimientoPostEgreso.all, 'list'] as const,
  },
}
