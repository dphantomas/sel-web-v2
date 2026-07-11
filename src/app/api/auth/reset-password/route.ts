// @ts-nocheck
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 })
    }

    // Buscar el token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Enlace inválido o expirado.' }, { status: 400 })
    }

    // Verificar expiración
    if (new Date() > new Date(resetToken.expires)) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json({ error: 'Este enlace ha expirado. Por favor, solicita uno nuevo.' }, { status: 400 })
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Actualizar usuario
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { passwordHash }
    })

    // Eliminar token usado
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })

    return NextResponse.json({ message: 'Contraseña actualizada correctamente.' })
  } catch (error) {
    console.error('Error en reset-password:', error)
    return NextResponse.json({ error: 'Ocurrió un error al actualizar la contraseña.' }, { status: 500 })
  }
}
