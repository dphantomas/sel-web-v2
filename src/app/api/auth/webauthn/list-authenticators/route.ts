// @ts-nocheck
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/webauthn/list-authenticators
 * Devuelve los autenticadores (passkeys) registrados del usuario autenticado.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const authenticators = await prisma.authenticator.findMany({
      where: { userId: session.user.id },
      select: {
        credentialID: true,
        credentialDeviceType: true,
        credentialBackedUp: true,
        transports: true,
        deviceName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ authenticators })
  } catch (error) {
    console.error('Error listando autenticadores:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
