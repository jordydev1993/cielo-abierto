import { LoginForm } from '@/components/auth/LoginForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm mx-4">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Cielo Abierto</CardTitle>
        <CardDescription>
          Sistema de Gestión Residencia NNyA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
