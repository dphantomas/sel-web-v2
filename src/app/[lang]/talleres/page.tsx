import { prisma } from '@/lib/prisma'
import Workshops from '@/components/talleres/Workshops'
import { sortCoursesByAdminPriority } from '@/lib/courseSorting'
import { getDictionary, Locale } from '@/i18n/dictionaries'

export const metadata = {
  title: 'Talleres | Sanación en Luz',
  description: 'Proceso de Sanación en Luz — talleres y encuentros para la evolución hacia el Nuevo Humano.',
}

export const dynamic = "force-dynamic";

export default async function TalleresPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  const talleres = await prisma.course.findMany({
    where: {
      published: true
    },
    include: {
      instances: {
        orderBy: { startDate: 'desc' }
      }
    }
  })

  const sortedTalleres = sortCoursesByAdminPriority(talleres)

  return <Workshops initialCourses={sortedTalleres} lang={lang} />
}
