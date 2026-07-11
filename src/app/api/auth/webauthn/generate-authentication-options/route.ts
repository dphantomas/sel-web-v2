// @ts-nocheck
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAuthenticationOptions } from '@simplewebauthn/server'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { authenticators: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (user.authenticators.length === 0) {
      return NextResponse.json({ error: 'No tienes dispositivos registrados. Inicia sesión con contraseña y regístralo en tu Perfil.' }, { status: 400 })
    }

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const rpID = host.split(':')[0]

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.authenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports ? auth.transports.split(',') : undefined,
      })),
      userVerification: 'required',
    })

    // Guardar challenge temporalmente
    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge }
    })

    return NextResponse.json(options)
  } catch (error) {
    console.error('Error generating authentication options:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
