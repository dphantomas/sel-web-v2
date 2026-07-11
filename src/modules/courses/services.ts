import { prisma } from "@/lib/prisma";

/**
 * Obtiene todos los cursos publicados, incluyendo información básica de sus módulos e instancias.
 */
export async function getPublishedCourses(_language?: string) {
  return await prisma.course.findMany({
    where: { published: true },
    include: {
      modules: {
        select: { id: true, title: true, order: true },
        orderBy: { order: 'asc' },
      },
      instances: {
        select: { id: true, startDate: true, endDate: true, price: true },
      },
    },
    orderBy: { title: 'asc' },
  });
}

/**
 * Obtiene un curso específico por su slug.
 */
export async function getCourseBySlug(slug: string, _language?: string) {
  return await prisma.course.findFirst({
    where: { slug },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, slug: true, order: true }, // No traemos el contenido completo para el índice
          },
        },
        orderBy: { order: 'asc' },
      },
      instances: true,
      resources: true,
    },
  });
}

/**
 * Obtiene una lección completa incluyendo sus recursos.
 */
export async function getLessonBySlug(slug: string) {
  return await prisma.lesson.findUnique({
    where: { slug },
    include: {
      resources: true,
      module: {
        include: {
          course: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
    },
  });
}
