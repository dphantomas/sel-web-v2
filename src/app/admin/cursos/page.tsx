import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminCoursesPanel from '@/components/admin/AdminCoursesPanel'
import { sortCoursesByAdminPriority } from '@/lib/courseSorting'

export const metadata = {
  title: 'Gestión de Cursos | Admin',
}

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
    redirect('/admin')
  }

  const [courses, users] = await Promise.all([
    prisma.course.findMany({
      orderBy: { id: 'asc' },
      include: {
        resources: true,
        instances: {
          orderBy: { startDate: 'desc' },
          include: { resources: true }
        }
      }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, image: true }
    })
  ])

  const sortedCourses = sortCoursesByAdminPriority(courses)

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-bold text-[#33275f] hover:text-[#9187BA] transition flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Volver al Panel
          </Link>
          <span className="text-xs bg-[#B681AE]/10 text-[#33275f] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Cursos e Instancias
          </span>
        </div>
        <AdminCoursesPanel initialUsers={users} courses={sortedCourses} />
      </div>
    </div>
  )
}
