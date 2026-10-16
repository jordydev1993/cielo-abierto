import Link from 'next/link'

const DEMO_ROUTES = [
  { href: '/retiros-demo', label: 'Retiro e identidad' },
  { href: '/timeline-nnya-demo', label: 'Timeline NNyA' },
  { href: '/alertas-educativas-demo', label: 'Alertas educativas' },
] as const

export function InnovacionDemoNavigation() {
  return (
    <nav aria-label="Navegación entre demostraciones" className="flex flex-wrap gap-2">
      {DEMO_ROUTES.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-md border border-outline-variant px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
