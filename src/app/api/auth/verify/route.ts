// @ts-nocheck
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/modules/auth/tokens'
import { sendEmail } from '@/modules/auth/email'
import { env } from '@/env'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get('host')}`

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/verificar-email?status=error&message=Token no proporcionado.`)
  }

  try {
    // Buscar token — en la DB está hasheado, el plano llega desde el email
    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { token: hashToken(token) }
    })

    if (!verificationRecord) {
      return NextResponse.redirect(`${baseUrl}/verificar-email?status=error&message=El enlace de verificación es inválido, expiró, o tu cuenta ya fue verificada anteriormente.`)
    }

    // Comprobar expiración
    if (verificationRecord.expires < new Date()) {
      return NextResponse.redirect(`${baseUrl}/verificar-email?status=error&message=El enlace de verificación ha expirado. Por favor, regístrate nuevamente.`)
    }

    // Actualizar usuario
    const user = await prisma.user.findUnique({
      where: { email: verificationRecord.email }
    })

    if (!user) {
      return NextResponse.redirect(`${baseUrl}/verificar-email?status=error&message=Usuario no encontrado.`)
    }

    await prisma.user.update({
      where: { email: verificationRecord.email },
      data: { emailVerified: new Date() }
    })

    // Eliminar token usado
    await prisma.emailVerificationToken.delete({
      where: { id: verificationRecord.id }
    })

    // Enviar notificación al administrador
    try {
      await sendEmail({
        to: env.REGISTRATION_EMAIL,
        subject: `Usuario verificado: ${user.firstName} ${user.lastName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h3 style="color: #2e7d32;">Un usuario ha verificado su cuenta</h3>
            <ul style="line-height: 1.6;">
              <li><strong>Nombre:</strong> ${user.firstName} ${user.lastName}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Teléfono:</strong> ${user.phone || 'No especificado'}</li>
              <li><strong>Estado:</strong> Cuenta Activa y Verificada</li>
              <li><strong>Fecha de verificación:</strong> ${new Date().toLocaleString('es-AR')}</li>
            </ul>
          </div>
        `
      })
    } catch (adminEmailError) {
      console.error('Error enviando notificación al admin de verificación:', adminEmailError)
    }

    return NextResponse.redirect(`${baseUrl}/verificar-email?status=success&message=Tu correo ha sido verificado exitosamente.`)
  } catch (error) {
    console.error('Error al verificar email:', error)
    
    try {
      await sendEmail({
        to: env.ALERTS_EMAIL,
        subject: `⚠️ Error Crítico en Verificación`,
        html: `<p>Se produjo un error al intentar verificar el correo con token ${token}:</p><pre>${error.message}</pre>`
      })
    } catch (e) {}

    return NextResponse.redirect(`${baseUrl}/verificar-email?status=error&message=Ocurrió un error inesperado al verificar.`)
  }
}
