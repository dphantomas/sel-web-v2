import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions)

    // Validar autorización
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del curso' }, { status: 400 })
    }

    const body = await req.json()
    const { title, slug, type, modality, description, shortDescription, image, published } = body

    const DEFAULT_COURSE_IMAGE = '/assets/default-course.jpg'
    const finalImage = (image === '' || !image) && image !== undefined ? DEFAULT_COURSE_IMAGE : image

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(type && { type }),
        ...(modality && { modality }),
        description: description !== undefined ? description : undefined, // Permite null/vacío
        shortDescription: shortDescription !== undefined ? shortDescription : undefined,
        image: finalImage !== undefined ? finalImage : undefined,
        ...(published !== undefined && { published }),
      },
      include: {
        instances: {
          orderBy: { startDate: 'desc' }
        }
      }
    })

    return NextResponse.json({ message: 'Curso actualizado', course: updatedCourse })
  } catch (error) {
    console.error('Error actualizando curso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del curso' }, { status: 400 })
    }

    // El esquema Prisma tiene onDelete: Cascade para instancias, módulos, accesos de usuarios, etc.
    // Al borrar el curso se borra todo su árbol dependiente.
    await prisma.course.delete({ where: { id } })

    return NextResponse.json({ message: 'Curso eliminado' })
  } catch (error) {
    console.error('Error eliminando curso:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
