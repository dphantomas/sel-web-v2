import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { NextResponse } from 'next/server'
import { sendWhatsAppNotification } from '@/lib/whatsapp'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de Admin o Transmisor.' }, { status: 403 })
    }

    const { userId, courseId, instanceId, enabled } = await request.json()

    if (!userId || !courseId || !instanceId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (userId, courseId, instanceId).' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    const instance = await prisma.courseInstance.findUnique({ where: { id: instanceId } })

    if (!user || !course || !instance) {
      return NextResponse.json({ error: 'Usuario, curso o instancia no encontrado.' }, { status: 404 })
    }

    if (enabled) {
      // Habilitar acceso a la instancia
      await prisma.userInstanceAccess.upsert({
        where: {
          userId_courseInstanceId: { userId, courseInstanceId: instanceId }
        },
        update: {},
        create: { userId, courseInstanceId: instanceId }
      })

      // Siempre asegurar que tengan acceso al curso padre
      await prisma.userCourseAccess.upsert({
        where: {
          userId_courseId: { userId, courseId }
        },
        update: {},
        create: { userId, courseId }
      })

      // Enviar notificación de WhatsApp si el usuario tiene teléfono (Deshabilitado por ahora)
      /*
      if (user.phone) {
        const startDate = new Date(instance.startDate).toLocaleDateString('es-AR')
        const message = `¡Hola ${user.firstName}! Se ha habilitado tu acceso a la instancia del ${startDate} del taller "${course.title}" en la plataforma de Sanación en Luz. Ya puedes ingresar a tu panel para ver los recursos en: ${process.env.NEXTAUTH_URL}/dashboard`
        await sendWhatsAppNotification(user.phone, message)
      }
      */

      // Ascender de Guest a Participante si es su primer curso
      if (user.role === 'Guest') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'Participante' }
        })
      }

    } else {
      // Deshabilitar acceso a esta instancia
      await prisma.userInstanceAccess.deleteMany({
        where: { userId, courseInstanceId: instanceId }
      })

      // Verificar si le quedan otras instancias habilitadas para este curso
      const otherInstances = await prisma.userInstanceAccess.findMany({
        where: { 
          userId, 
          courseInstance: { courseId: courseId } 
        }
      })

      // Si no le quedan instancias de este curso, le sacamos el acceso al curso padre
      if (otherInstances.length === 0) {
        await prisma.userCourseAccess.deleteMany({
          where: { userId, courseId }
        })
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        unlockedCourses: true,
        unlockedInstances: true
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error al actualizar acceso de taller:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
