import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="mx-4 w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-heading font-bold text-white" aria-hidden="true">A</span>
        <h1 className="text-title font-semibold text-on-surface">Argüello Infancias</h1>
        <p className="mt-1 text-body text-on-surface-variant">Sistema de Gestión Residencia NNyA</p>
      </div>
      <LoginForm />
    </div>
  )
}
