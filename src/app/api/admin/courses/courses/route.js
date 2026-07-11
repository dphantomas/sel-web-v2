import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    // Validar autorización
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { title, slug, description, shortDescription, image, type, modality, published } = body

    if (!title || !slug || !type) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (title, slug, type)' }, { status: 400 })
    }

    // Verificar si el slug ya existe
    const existingCourse = await prisma.course.findUnique({ where: { slug } })
    if (existingCourse) {
      return NextResponse.json({ error: 'Ya existe un curso con ese slug.' }, { status: 400 })
    }

    const DEFAULT_COURSE_IMAGE = '/assets/default-course.jpg'
    const finalImage = image || DEFAULT_COURSE_IMAGE

    const newCourse = await prisma.course.create({
      data: {
        title,
        slug,
        description: description || null,
        shortDescription: shortDescription || null,
        image: finalImage,
        type,
        modality: modality || 'Virtual',
        published: published || false
      },
      include: {
        instances: true
      }
    })

    return NextResponse.json({ message: 'Curso creado', course: newCourse }, { status: 201 })
  } catch (error) {
    console.error('Error creando curso:', error)
    return NextResponse.json({ error: 'Error interno del servidor al crear curso' }, { status: 500 })
  }
}
