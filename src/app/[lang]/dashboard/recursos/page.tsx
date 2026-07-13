import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import UserResourcesList from '@/components/dashboard/UserResourcesList'

export const metadata = {
  title: 'Mis Materiales | Sanación en Luz',
  description: 'Materiales de estudio y archivos de la plataforma de Sanación en Luz.'
}

export default async function DashboardRecursosPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Obtener información del usuario y sus accesos (tanto a cursos como a instancias)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      unlockedCourses: {
        select: { courseId: true }
      },
      unlockedInstances: {
        include: {
          courseInstance: {
            include: {
              course: true
            }
          }
        },
        orderBy: {
          courseInstance: { startDate: 'desc' }
        }
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Juntar todos los IDs de cursos a los que tiene acceso
  const courseIds = new Set([
    ...user.unlockedCourses.map(uc => uc.courseId),
    ...user.unlockedInstances.map(ui => ui.courseInstance.courseId)
  ])

  // Juntar todos los IDs de instancias a los que tiene acceso
  const instanceIds = new Set(user.unlockedInstances.map(ui => ui.courseInstanceId))

  // Obtener los recursos de todos esos cursos Y validar instancias
  const allResourcesRaw = await prisma.resource.findMany({
    where: {
      OR: [
        { courseId: { in: Array.from(courseIds) }, courseInstanceId: null },
        { courseInstanceId: { in: Array.from(instanceIds) } }
      ]
    },
    include: {
      course: { select: { title: true } },
      courseInstance: {
        include: { course: { select: { title: true } } }
      }
    }
  })

  // Aplanar recursos agregando title manual
  const allResources = allResourcesRaw.map(r => ({
    ...r,
    courseTitle: r.courseInstance?.course?.title || r.course?.title || 'Recurso'
  }))
  
  // Encontrar IDs de recursos que han sido reemplazados por uno más nuevo
  const overriddenIds = new Set(allResources.map(r => r.overridesResourceId).filter(Boolean))
  
  // Filtrar los recursos que NO están en la lista de reemplazados
  const finalResources = allResources.filter(r => !overriddenIds.has(r.id))

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
              Mis Materiales
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Materiales de estudio y archivos de la plataforma.
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-12">
          {/* Material de Estudio (Recursos) */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-[#33275f] text-xl font-bold tracking-wide">MIS MATERIALES DE ESTUDIO</h2>
              <span className="bg-[#B681AE]/10 text-[#33275f] text-xs font-bold px-3 py-1 rounded-full">
                {finalResources.length} Archivos
              </span>
            </div>
            <UserResourcesList resources={finalResources} />
          </div>
        </div>

      </div>
    </div>
  )
}
