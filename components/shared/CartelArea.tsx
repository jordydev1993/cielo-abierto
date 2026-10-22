'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ubicacion } from '@/lib/navegacion'
import { cn } from '@/lib/utils'

const fecha = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

// Cartel de área (prompts/051): como la señalética de un hospital, cada pantalla abre
// diciendo en qué módulo y en qué área estás, en el color de esa área.
export function CartelArea() {
  const pathname = usePathname()
  const { user, role } = useAuth()
  const { area, item } = ubicacion(pathname)
  const Icono = item.icon
  // La fecha se arma en el navegador: en el servidor la zona horaria es otra y no coincide.
  const [hoy, setHoy] = useState('')
  useEffect(() => setHoy(fecha.format(new Date())), [])

  return (
    <div className={cn('flex items-center gap-4 px-8 py-3 text-white', area.fondo)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-surface-container-lowest" aria-hidden="true">
        <Icono className="h-5 w-5 text-ink" strokeWidth={2.25} />
      </span>
      <p className="flex items-baseline gap-3 font-heading">
        <span className="text-xl font-extrabold leading-none">{item.label}</span>
        <span className="h-4 w-px self-center bg-surface-container-lowest/50" aria-hidden="true" />
        <span className="text-heading font-bold uppercase tracking-[0.12em]">{area.nombre}</span>
      </p>
      <p className="ml-auto text-right text-small leading-tight">
        {user?.email && <span className="block font-semibold">{user.email}</span>}
        <span className="first-letter:uppercase block">
          {role ?? ''}{role && hoy ? ' · ' : ''}{hoy}
        </span>
      </p>
    </div>
  )
}
