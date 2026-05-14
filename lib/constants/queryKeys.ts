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
  alertas: {
    all: ['alertas'] as const,
    pendientes: () => [...queryKeys.alertas.all, 'pendientes'] as const,
    byNnya: (nnyaId: string) => [...queryKeys.alertas.all, 'nnya', nnyaId] as const,
  },
}
