import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/modules/auth/email'
import { env } from '@/env'

// Artículo + palabra en español para cada tipo de curso/taller, usado en el email de invitación a reseña.
const courseTypeLabels = {
  Curso: 'el curso',
  Taller: 'el taller',
  Iniciacion: 'la iniciación',
  Activacion: 'la activación',
  Retiro: 'el retiro'
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado. Se requieren permisos de Admin o Transmisor.' }, { status: 403 })
    }

    const { instanceId } = await request.json()

    if (!instanceId) {
      return NextResponse.json({ error: 'Falta el parámetro requerido (instanceId).' }, { status: 400 })
    }

    const instance = await prisma.courseInstance.findUnique({
      where: { id: instanceId },
      include: {
        course: true,
        usersWithAccess: { include: { user: true } }
      }
    })

    if (!instance) {
      return NextResponse.json({ error: 'Instancia no encontrada.' }, { status: 404 })
    }

    const typeLabel = courseTypeLabels[instance.course.type] || 'el taller'
    const reviewUrl = `${process.env.NEXTAUTH_URL || 'https://sanacionenluz.com'}/escribir-resena`

    const recipients = instance.usersWithAccess
      .map(access => access.user)
      .filter(user => !!user.email)

    const results = await Promise.allSettled(
      recipients.map(user => {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #6d28d9;">¡Hola ${user.firstName}!</h2>
            <p>Completaste ${typeLabel} <strong>"${instance.course.title}"</strong> en Sanación en Luz.</p>
            <p>Nos encantaría conocer tu experiencia. Cuando lo desees, puedes dejarnos tu testimonio haciendo clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" style="background-color: #9187ba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Compartir mi experiencia</a>
            </div>
            <p>¡Gracias por ser parte de Sanación en Luz!</p>
          </div>
        `

        return sendEmail({
          to: user.email,
          subject: `Completaste ${instance.course.title} - Sanación en Luz`,
          html: emailHtml,
          from: env.TALLERES_EMAIL,
          fromName: 'Talleres - Sanación en Luz'
        })
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    const skipped = instance.usersWithAccess.length - recipients.length

    if (failed > 0) {
      console.error('Error enviando email de invitación a reseña a algunos usuarios:', results.filter(r => r.status === 'rejected'))
    }

    return NextResponse.json({ success: true, sent, failed, skipped, total: instance.usersWithAccess.length })
  } catch (error) {
    console.error('Error al enviar emails de invitación a reseña:', error)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
