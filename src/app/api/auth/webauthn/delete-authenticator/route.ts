// @ts-nocheck
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/auth/webauthn/delete-authenticator
 * Body: { credentialID: string }
 * Elimina un autenticador (passkey) del usuario autenticado.
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { credentialID } = await request.json()

    if (!credentialID) {
      return NextResponse.json({ error: 'credentialID requerido' }, { status: 400 })
    }

    // Verificar que el autenticador pertenece al usuario que hace el request
    const authenticator = await prisma.authenticator.findFirst({
      where: {
        credentialID,
        userId: session.user.id,
      },
    })

    if (!authenticator) {
      return NextResponse.json(
        { error: 'Dispositivo no encontrado o no pertenece a tu cuenta' },
        { status: 404 }
      )
    }

    await prisma.authenticator.delete({
      where: { credentialID },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando autenticador:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
