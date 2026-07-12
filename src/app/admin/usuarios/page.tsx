import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminUsersPanel from '@/components/admin/AdminUsersPanel'
import { sortCoursesByAdminPriority } from '@/lib/courseSorting'

export const metadata = {
  title: 'Gestión de Usuarios | Admin',
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
    redirect('/admin')
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      unlockedCourses: { select: { courseId: true } },
      unlockedInstances: { select: { courseInstanceId: true } }
    }
  })

  const courses = await prisma.course.findMany({
    orderBy: { id: 'asc' },
    include: {
      resources: true,
      instances: {
        orderBy: { startDate: 'desc' },
        include: { resources: true }
      }
    }
  })

  const sortedCourses = sortCoursesByAdminPriority(courses)

  return (
    <div className="w-full">
      <AdminUsersPanel initialUsers={users} courses={sortedCourses} />
    </div>
  )
}
