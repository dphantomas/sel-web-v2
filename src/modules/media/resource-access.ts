import { prisma } from '@/lib/prisma'

/**
 * Regla ÚNICA de acceso a recursos, compartida por el dashboard (que los lista)
 * y el visor (que los abre).
 *
 * Vivían separadas y divergían: el dashboard consideraba desbloqueado un curso
 * al que se llegaba por una instancia, y el visor no. Resultado: recursos que
 * aparecían en la grilla y al hacerles clic rebotaban al dashboard. Si esta
 * regla se toca, se toca acá y las dos superficies se mueven juntas.
 */
export type ResourceScope = {
  courseIds: Set<string>
  instanceIds: Set<string>
}

/** Devuelve todo lo que el usuario tiene desbloqueado, directo o vía instancia. */
export async function getUserResourceScope(userId: string): Promise<ResourceScope> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      unlockedCourses: { select: { courseId: true } },
      unlockedInstances: {
        select: { courseInstanceId: true, courseInstance: { select: { courseId: true } } },
      },
    },
  })

  if (!user) return { courseIds: new Set(), instanceIds: new Set() }

  return {
    // Tener una instancia de un curso implica tener el curso: es la regla que
    // el dashboard ya aplicaba y el visor no.
    courseIds: new Set([
      ...user.unlockedCourses.map((uc) => uc.courseId),
      ...user.unlockedInstances.map((ui) => ui.courseInstance.courseId),
    ]),
    instanceIds: new Set(user.unlockedInstances.map((ui) => ui.courseInstanceId)),
  }
}

/**
 * ¿Puede este usuario abrir este recurso?
 *
 * Espeja exactamente el `where` con el que el dashboard los lista:
 * un recurso de instancia exige tener esa instancia; uno de nivel curso exige
 * tener el curso (por acceso directo o por instancia).
 */
export function canAccessResource(
  resource: { courseId: string | null; courseInstanceId: string | null },
  scope: ResourceScope,
): boolean {
  if (resource.courseInstanceId) {
    return scope.instanceIds.has(resource.courseInstanceId)
  }
  if (resource.courseId) {
    return scope.courseIds.has(resource.courseId)
  }
  // Sin curso ni instancia (ej. sólo lessonId) no hay regla de acceso definida:
  // se niega. El dashboard tampoco los lista.
  return false
}

export type ResourceKind = 'pdf' | 'audio' | 'video' | 'other'

/**
 * Clasifica el recurso por su MIME. EXCLUYENTE y en este orden a propósito.
 *
 * `Resource.type` guarda lo que el navegador reportó al subir el archivo, y los
 * MIME reales se solapan: `audio/mp4` (lo que Chrome emite para varios .m4a)
 * contiene "audio" Y "mp4". Con condiciones independientes daba las dos cosas a
 * la vez y el visor montaba un reproductor de video y uno de audio al mismo
 * tiempo. Audio se evalúa antes que video por eso mismo.
 */
export function classifyResource(type: string | null): ResourceKind {
  const t = (type || '').toLowerCase()
  if (t.includes('pdf')) return 'pdf'
  if (t.includes('audio') || t.includes('mp3') || t.includes('m4a')) return 'audio'
  if (t.includes('video') || t.includes('mp4')) return 'video'
  return 'other'
}
