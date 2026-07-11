import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    // Validar autorización
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { firstName, lastName, email, phone, role } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Nombre, apellido y correo son obligatorios' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    // Comprobar si existe
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado.' }, { status: 400 })
    }

    // Generar contraseña base desde el prefijo del correo
    const emailPrefix = emailLower.split('@')[0]
    // Asegurar que siempre termine en "123"
    const rawPassword = emailPrefix + '123'
    const passwordHash = await bcrypt.hash(rawPassword, 10)

    // Crear el usuario
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailLower,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: role || 'Participante',
        emailVerified: new Date() // Se da por validado porque lo crea el administrador
      },
      include: {
        unlockedCourses: {
          select: {
            courseId: true
          }
        }
      }
    })

    return NextResponse.json({ message: 'Usuario creado exitosamente', user: newUser })
  } catch (error) {
    console.error('Error creando usuario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
