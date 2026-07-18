import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { textEs, textEn, order, isActive } = body

    const dataToUpdate = {}
    if (textEs !== undefined) dataToUpdate.textEs = textEs
    if (textEn !== undefined) dataToUpdate.textEn = textEn
    if (order !== undefined) dataToUpdate.order = order
    if (isActive !== undefined) dataToUpdate.isActive = isActive

    const updated = await prisma.homePhrase.update({
      where: { id },
      data: dataToUpdate,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating phrase:', error)
    return NextResponse.json({ error: 'Error al actualizar la frase' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    await prisma.homePhrase.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting phrase:', error)
    return NextResponse.json({ error: 'Error al eliminar la frase' }, { status: 500 })
  }
}
