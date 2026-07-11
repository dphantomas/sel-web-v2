import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const publicId = searchParams.get('public_id')

    if (!publicId) {
      return NextResponse.json({ error: 'Falta public_id' }, { status: 400 })
    }

    // Call Cloudinary API to destroy the resource
    const result = await cloudinary.uploader.destroy(publicId)
    
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Error al borrar de Cloudinary:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
