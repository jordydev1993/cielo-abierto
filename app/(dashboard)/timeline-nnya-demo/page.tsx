import { TimelineNnyaDemo } from '@/components/entities/nnya/TimelineNnyaDemo'
import { InnovacionDemoNavigation } from '@/components/entities/retiros/InnovacionDemoNavigation'

export default function TimelineNnyaDemoPage() {
  return (
    <div className="max-w-4xl space-y-6 px-8 py-6">
      <header className="space-y-2">
        <h1 className="font-heading text-title font-semibold text-on-surface">Demostración de timeline</h1>
        <p className="text-sm text-on-surface-variant">
          Vista aislada con eventos ficticios; no representa el historial de ningún NNyA.
        </p>
      </header>
      <InnovacionDemoNavigation />
      <TimelineNnyaDemo />
    </div>
  )
}
