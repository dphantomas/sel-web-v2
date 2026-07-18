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

    const phrases = await prisma.homePhrase.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(phrases)
  } catch (error) {
    console.error('Error fetching phrases:', error)
    return NextResponse.json({ error: 'Error al obtener las frases' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { textEs, textEn } = body

    if (!textEs || !textEn) {
      return NextResponse.json({ error: 'Faltan datos requeridos (textEs, textEn)' }, { status: 400 })
    }

    // Calcular el orden (al final)
    const count = await prisma.homePhrase.count()

    const newPhrase = await prisma.homePhrase.create({
      data: {
        textEs,
        textEn,
        order: count,
      },
    })

    return NextResponse.json(newPhrase, { status: 201 })
  } catch (error) {
    console.error('Error creating phrase:', error)
    return NextResponse.json({ error: 'Error al guardar la frase' }, { status: 500 })
  }
}
