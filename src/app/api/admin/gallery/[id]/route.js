import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const image = await prisma.galleryImage.findUnique({ where: { id } })
    if (!image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
    }

    // Borrar de Cloudinary
    try {
      await cloudinary.uploader.destroy(image.publicId, { invalidate: true })
    } catch (e) {
      console.error('Error eliminando de Cloudinary:', e)
    }

    // Borrar de DB
    await prisma.galleryImage.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting gallery image:', error)
    return NextResponse.json({ error: 'Error al eliminar la imagen' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { alt, order } = body

    const dataToUpdate = {}
    if (alt !== undefined) dataToUpdate.alt = alt
    if (order !== undefined) dataToUpdate.order = order

    const updated = await prisma.galleryImage.update({
      where: { id },
      data: dataToUpdate,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating gallery image:', error)
    return NextResponse.json({ error: 'Error al actualizar la imagen' }, { status: 500 })
  }
}
