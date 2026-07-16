// @ts-nocheck
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { generateToken } from '@/modules/auth/tokens'
import { guard, getClientIp } from '@/lib/rate-limit'
import { sendEmail } from '@/modules/auth/email'

export async function POST(request) {
  try {
    // Va antes de leer el body: el registro crea filas y manda mails, así que el
    // límite se cobra por intentar, no por acertar el formato.
    const limited = await guard([
      { key: `register:ip:${getClientIp(request)}`, limit: 5, windowSec: 3600 },
    ])
    if (limited) return limited

    const { firstName, lastName, email, phone, birthDate, password } = await request.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados.' },
        { status: 400 }
      )
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del correo electrónico no es válido.' },
        { status: 400 }
      )
    }

    // Validación de contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase().trim()

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado.' },
        { status: 400 }
      )
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    let parsedBirthDate = null
    if (birthDate) {
      const bDate = new Date(birthDate)
      if (!isNaN(bDate.getTime())) {
        parsedBirthDate = bDate
      }
    }

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailLower,
        phone: phone ? phone.trim() : null,
        birthDate: parsedBirthDate,
        passwordHash,
        role: 'Guest' // Rol por defecto
      }
    })

    // Generar token de verificación — en la DB se guarda solo el hash; el plano viaja en el email
    const { token, tokenHash } = generateToken()
    const expires = new Date(Date.now() + 24 * 3600000) // 24 horas de validez

    // Guardar token en DB (borrar anteriores si los hay por algún motivo)
    await prisma.emailVerificationToken.deleteMany({ where: { email: emailLower } })
    await prisma.emailVerificationToken.create({
      data: {
        email: emailLower,
        token: tokenHash,
        expires
      }
    })

    // URL de verificación dinámica
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = (process.env.NEXTAUTH_URL || `${protocol}://${host}`).replace(/\/$/, '')
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`

    // Enviar email de verificación al usuario
    await sendEmail({
      to: emailLower,
      subject: 'Verifica tu correo electrónico - Sanación en Luz',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #33275f;">¡Bienvenido a Sanación en Luz!</h2>
          <p>Hola ${firstName},</p>
          <p>Gracias por registrarte. Para activar tu cuenta y poder iniciar sesión, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #B681AE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Verificar mi correo
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">Este enlace expirará en 24 horas.</p>
          <hr style="border: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 12px; color: #999; text-align: center;">Sanación en Luz</p>
        </div>
      `
    })

    // Enviar notificación al administrador
    try {
      await sendEmail({
        to: 'registro@sanacionenluz.com',
        subject: `Nuevo usuario registrado: ${firstName} ${lastName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h3 style="color: #33275f;">Nuevo registro en el sistema (Pendiente de Verificación)</h3>
            <ul style="line-height: 1.6;">
              <li><strong>Nombre:</strong> ${firstName} ${lastName}</li>
              <li><strong>Email:</strong> ${emailLower}</li>
              <li><strong>Teléfono:</strong> ${phone || 'No especificado'}</li>
              <li><strong>Estado:</strong> Pendiente de verificación de email</li>
              <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</li>
            </ul>
          </div>
        `
      })
    } catch (adminEmailError) {
      console.error('Error enviando notificación al admin:', adminEmailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado. Se ha enviado un correo de verificación.'
    })
  } catch (error) {
    console.error('Error al registrar usuario:', error)
    
    // Alerta de error interno al admin
    try {
      await sendEmail({
        to: 'registro@sanacionenluz.com',
        subject: `⚠️ Error Crítico en Registro de Usuario`,
        html: `<p>Se produjo un error interno al intentar registrar un usuario:</p><pre>${error.message || 'Error desconocido'}</pre>`
      })
    } catch (e) {
      console.error('No se pudo enviar alerta de error:', e)
    }

    return NextResponse.json(
      { error: 'Ocurrió un error inesperado durante el registro.' },
      { status: 500 }
    )
  }
}
