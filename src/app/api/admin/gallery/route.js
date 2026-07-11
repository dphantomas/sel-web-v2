import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const images = await prisma.galleryImage.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json({ error: 'Error al obtener la galería' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { url, publicId, alt } = body

    if (!url || !publicId) {
      return NextResponse.json({ error: 'Faltan datos requeridos (url, publicId)' }, { status: 400 })
    }

    // Calcular el orden (al final)
    const count = await prisma.galleryImage.count()

    const newImage = await prisma.galleryImage.create({
      data: {
        url,
        publicId,
        alt: alt || 'Sanación en Luz — Galería',
        order: count,
      },
    })

    return NextResponse.json(newImage, { status: 201 })
  } catch (error) {
    console.error('Error creating gallery image:', error)
    return NextResponse.json({ error: 'Error al guardar la imagen' }, { status: 500 })
  }
}
