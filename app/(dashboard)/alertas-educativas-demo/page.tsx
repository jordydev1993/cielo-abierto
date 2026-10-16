import { AlertasEducativasDemo } from '@/components/entities/alertas/AlertasEducativasDemo'
import { InnovacionDemoNavigation } from '@/components/entities/retiros/InnovacionDemoNavigation'

export default function AlertasEducativasDemoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-xl font-semibold text-on-surface">
          Demostración de alertas educativas
        </h1>
        <p className="text-sm text-on-surface-variant">
          Prototipo separado de las alertas reales. Los registros son locales y se descartan al recargar.
        </p>
      </header>
      <InnovacionDemoNavigation />
      <AlertasEducativasDemo />
    </div>
  )
}
