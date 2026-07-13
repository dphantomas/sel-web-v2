import { env } from '@/env'
import { LoginPageClient } from './LoginPageClient'

export const metadata = {
  title: "Iniciar Sesión | Sanación en Luz",
}

export default function LoginPage() {
  const googleEnabled = env.ENABLE_GOOGLE_AUTH === "true"

  return <LoginPageClient googleEnabled={googleEnabled} />
}
