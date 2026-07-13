import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UserProfileForm from '@/components/dashboard/UserProfileForm'

export const metadata = {
  title: 'Mis Datos | Sanación en Luz',
  description: 'Datos personales de la plataforma de Sanación en Luz.'
}

export default async function DashboardPerfilPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      unlockedCourses: {
        include: { course: true }
      },
      unlockedInstances: {
        include: { courseInstance: { include: { course: true } } }
      },
    }
  })

  if (!user) {
    redirect('/login')
  }


  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed pt-28 pb-16 px-4 md:px-6"
      style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header del Panel */}
        <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-[#33275f] text-2xl md:text-3xl font-bold mt-1">
              Mis Datos
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Gestión de tu información personal.
            </p>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <UserProfileForm 
            user={user} 
            hasInitiatoryRetreat={
              user.unlockedCourses.some(uc => uc.course.title.includes('Retiro Iniciático')) ||
              user.unlockedInstances.some(ui => ui.courseInstance.course.title.includes('Retiro Iniciático'))
            }
          />
        </div>

      </div>
    </div>
  )
}
