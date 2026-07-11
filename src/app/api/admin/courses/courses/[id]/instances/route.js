import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: courseId } = await params
    if (!courseId) {
      return NextResponse.json({ error: 'Falta el ID del curso' }, { status: 400 })
    }

    const body = await req.json()
    const { startDate, endDate, price, location } = body

    if (!startDate) {
      return NextResponse.json({ error: 'La fecha de inicio es obligatoria' }, { status: 400 })
    }

    const newInstance = await prisma.courseInstance.create({
      data: {
        courseId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        price: price ? parseFloat(price) : null,
        location: location || null
      }
    })

    return NextResponse.json({ message: 'Instancia creada exitosamente', instance: newInstance }, { status: 201 })
  } catch (error) {
    console.error('Error creando instancia:', error)
    return NextResponse.json({ error: 'Error interno del servidor al crear instancia' }, { status: 500 })
  }
}
