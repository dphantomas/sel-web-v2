import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PasskeyManager from '@/components/auth/PasskeyManager'
import { KeyRound } from 'lucide-react'

export const metadata = {
  title: 'Seguridad | Sanación en Luz',
  description: 'Gestión de seguridad y métodos de acceso',
}

export default async function SeguridadPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      authenticators: {
        select: {
          credentialID: true,
          credentialDeviceType: true,
          credentialBackedUp: true,
          transports: true,
          deviceName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#33275f]/5 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[#33275f]" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#33275f] tracking-tight">Seguridad</h1>
          </div>
          <p className="text-gray-500 max-w-2xl text-sm lg:text-base">
            Administrá tus passkeys para iniciar sesión rápidamente de forma segura y sin contraseñas.
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
          <PasskeyManager initialAuthenticators={user.authenticators as any} userEmail={session.user.email || undefined} />
        </div>

      </div>
    </div>
  )
}
