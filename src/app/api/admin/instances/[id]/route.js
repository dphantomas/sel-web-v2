import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Transmisor')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: instanceId } = await params
    if (!instanceId) {
      return NextResponse.json({ error: 'Falta el ID de la instancia' }, { status: 400 })
    }

    const body = await req.json()
    const { startDate, endDate, price, location } = body

    const updatedInstance = await prisma.courseInstance.update({
      where: { id: instanceId },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        price: price ? parseFloat(price) : null,
        location: location || null
      }
    })

    return NextResponse.json({ message: 'Instancia actualizada exitosamente', instance: updatedInstance }, { status: 200 })
  } catch (error) {
    console.error('Error actualizando instancia:', error)
    return NextResponse.json({ error: 'Error interno del servidor al actualizar instancia' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden borrar instancias' }, { status: 403 })
    }

    const { id: instanceId } = await params
    if (!instanceId) {
      return NextResponse.json({ error: 'Falta el ID de la instancia' }, { status: 400 })
    }

    await prisma.courseInstance.delete({
      where: { id: instanceId }
    })

    return NextResponse.json({ message: 'Instancia borrada exitosamente' }, { status: 200 })
  } catch (error) {
    console.error('Error borrando instancia:', error)
    return NextResponse.json({ error: 'Error interno del servidor al borrar instancia' }, { status: 500 })
  }
}
