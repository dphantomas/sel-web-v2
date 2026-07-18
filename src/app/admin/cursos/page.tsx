import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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
      select: {
        id: true, firstName: true, lastName: true, email: true, role: true, image: true,
        unlockedCourses: { select: { courseId: true } },
        unlockedInstances: { select: { courseInstanceId: true } }
      }
    })
  ])

  const sortedCourses = sortCoursesByAdminPriority(courses)

  return (
    <div className="w-full">
      <AdminCoursesPanel initialUsers={users} courses={sortedCourses} />
    </div>
  )
}
