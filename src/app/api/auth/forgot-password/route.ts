// @ts-nocheck
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/modules/auth/tokens'
import { guard, getClientIp } from '@/lib/rate-limit'
import { sendEmail } from '@/modules/auth/email'

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Debes proporcionar un email.' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    // Cada llamada manda un mail: sin límite por email, cualquiera inunda la
    // casilla de un tercero y de paso quema la reputación del SMTP. El límite
    // por email se aplica exista o no la cuenta — si solo limitáramos las que
    // existen, la diferencia de respuesta permitiría enumerar usuarios.
    const limited = await guard([
      { key: `forgot:ip:${getClientIp(req)}`, limit: 5, windowSec: 3600 },
      { key: `forgot:email:${emailLower}`, limit: 3, windowSec: 3600 },
    ])
    if (limited) return limited

    const user = await prisma.user.findUnique({ where: { email: emailLower } })

    if (!user) {
      // Por seguridad, no indicamos que el usuario no existe, pero retornamos éxito
      return NextResponse.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' })
    }

    // Generar token — en la DB se guarda solo el hash; el plano viaja en el email
    const { token, tokenHash } = generateToken()
    const expires = new Date(Date.now() + 3600000) // 1 hora de validez

    // Guardar token en DB (borrar los anteriores del mismo usuario si los hay)
    await prisma.passwordResetToken.deleteMany({ where: { email: emailLower } })
    await prisma.passwordResetToken.create({
      data: {
        email: emailLower,
        token: tokenHash,
        expires
      }
    })

    // URL de reseteo dinámica
    const protocol = req.headers.get('x-forwarded-proto') || 'https'
    const host = req.headers.get('host') || 'localhost:3000'
    const baseUrl = (process.env.NEXTAUTH_URL || `${protocol}://${host}`).replace(/\/$/, '')
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Enviar email
    await sendEmail({
      to: emailLower,
      subject: 'Recuperación de Contraseña - Sanación en Luz',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #33275f;">Recuperación de Contraseña</h2>
          <p>Hola ${user.firstName},</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #B681AE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">Este enlace expirará en 1 hora.</p>
          <p style="font-size: 14px; color: #666;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          <hr style="border: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 12px; color: #999; text-align: center;">Sanación en Luz</p>
        </div>
      `
    })

    return NextResponse.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' })
  } catch (error) {
    console.error('Error en forgot-password:', error)
    // Mostramos el mensaje exacto para ayudar al usuario a depurar problemas de Google Workspace
    return NextResponse.json({ error: `Ocurrió un error al enviar el correo: ${error.message}` }, { status: 500 })
  }
}
