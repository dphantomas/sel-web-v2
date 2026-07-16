// @ts-nocheck
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/modules/auth/auth'
import { prisma } from '@/lib/prisma'
import { getRelyingParty } from '@/modules/auth/rp'
import { generateRegistrationOptions } from '@simplewebauthn/server'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { authenticators: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const rpName = 'Sanación en Luz'
    const { rpID } = getRelyingParty()

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.email,
      attestationType: 'none',
      excludeCredentials: user.authenticators.map((auth) => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports ? auth.transports.split(',') : undefined,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
        authenticatorAttachment: 'platform', // Solo autenticadores del dispositivo (Face ID, Touch ID, Windows Hello)
      },
    })

    // Guarda el challenge
    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge }
    })

    return NextResponse.json(options)
  } catch (error) {
    console.error('Error generating registration options:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
