import { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { sendEmail } from '@/modules/auth/email'
import { getRelyingParty } from '@/modules/auth/rp'
import { consume, getClientIpFromHeaders } from '@/lib/rate-limit'
import { env } from '@/env'

// Ampliamos los tipos de NextAuth para incluir el rol y teléfono
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      phone?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    role: string;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    phone?: string | null;
  }
}

const providers: any[] = [
  CredentialsProvider({
    name: 'Credenciales',
    credentials: {
      email: { label: 'Correo', type: 'email' },
      password: { label: 'Contraseña', type: 'password' },
      assertion: { label: 'WebAuthn Assertion', type: 'text' }
    },
    async authorize(credentials, req) {
      if (!credentials?.email) {
        throw new Error('Por favor, ingresa correo.')
      }

      // Mensaje único para credenciales inválidas: distinguir "correo no
      // registrado" de "contraseña incorrecta" permite enumerar usuarios.
      const INVALID_CREDENTIALS = 'Email o contraseña incorrectos.'

      const emailLower = credentials.email.toLowerCase().trim()
      const ip = getClientIpFromHeaders(req?.headers)

      // Se consume ANTES de validar la contraseña: si contáramos solo los
      // intentos fallidos, habría que leer la contraseña primero y el atacante
      // ya nos habría costado un bcrypt por intento.
      //
      // La cubeta por IP es holgada porque una oficina o un celular tras NAT
      // comparten IP entre varias personas; la que realmente frena la fuerza
      // bruta contra una cuenta es la de IP+email.
      //
      // No hay cubeta por email solo, a propósito: sería un botón para dejar
      // afuera a cualquier usuario con solo repetir su dirección.
      const [byIp, byIpAndEmail] = await Promise.all([
        consume({ key: `login:ip:${ip}`, limit: 20, windowSec: 900 }),
        consume({ key: `login:combo:${ip}:${emailLower}`, limit: 5, windowSec: 900 }),
      ])

      if (!byIp.allowed || !byIpAndEmail.allowed) {
        const minutos = Math.ceil(Math.max(byIp.retryAfterSec, byIpAndEmail.retryAfterSec) / 60)
        throw new Error(`Demasiados intentos. Probá de nuevo en ${minutos} minuto${minutos === 1 ? '' : 's'}.`)
      }

      const user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: { authenticators: true }
      })

      if (!user) {
        throw new Error(INVALID_CREDENTIALS)
      }

      if (!user.emailVerified) {
        throw new Error('Debes verificar tu correo electrónico antes de iniciar sesión. Por favor, revisa tu bandeja de entrada.')
      }

      // WebAuthn Passkey Login
      if (credentials.assertion) {
        if (!user.currentChallenge) {
          throw new Error('Desafío inválido o expirado. Intenta de nuevo.')
        }

        let assertion;
        try {
          assertion = JSON.parse(credentials.assertion)
        } catch (e) {
          throw new Error('Aserción inválida.')
        }

        const authenticator = user.authenticators.find(
          (auth) => auth.credentialID === assertion.id
        )

        if (!authenticator) {
          throw new Error('Dispositivo no reconocido para este usuario.')
        }

        // Fijados desde NEXTAUTH_URL, nunca desde los headers del request: el
        // header Host lo controla el cliente, y usarlo como valor "esperado"
        // degrada la verificación a aceptar el origen que el atacante declare.
        const { expectedOrigin, rpID: expectedRPID } = getRelyingParty()

        let verification;
        try {
          verification = await verifyAuthenticationResponse({
            response: assertion,
            expectedChallenge: user.currentChallenge,
            expectedOrigin,
            expectedRPID,
            authenticator: {
              credentialID: Buffer.from(authenticator.credentialID, 'base64url'),
              credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64url'),
              counter: authenticator.counter,
              transports: authenticator.transports ? authenticator.transports.split(',') as any : undefined,
            },
          })
        } catch (error: any) {
          throw new Error('Fallo al verificar la huella: ' + error.message)
        }

        if (verification.verified) {
          const { authenticationInfo } = verification
          await prisma.authenticator.update({
            where: { credentialID: authenticator.credentialID },
            data: { counter: authenticationInfo.newCounter }
          })

          await prisma.user.update({
            where: { id: user.id },
            data: { currentChallenge: null }
          })

          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            phone: user.phone
          }
        } else {
          throw new Error('Fallo en la verificación biométrica.')
        }
      }

      // Password Login
      if (!credentials.password) {
        throw new Error('Contraseña o huella requerida.')
      }

      // Mismo mensaje que "usuario inexistente": decir que la cuenta existe
      // pero entra por Google/passkey también sirve para enumerar.
      if (!user.passwordHash) {
        throw new Error(INVALID_CREDENTIALS)
      }

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

      if (!isValid) {
        throw new Error(INVALID_CREDENTIALS)
      }

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    }
  })
];

// Inyección condicional de Google Auth
if (env.ENABLE_GOOGLE_AUTH === "true" && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent select_account",
        },
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const emailLower = user.email!.toLowerCase().trim()
          let dbUser = await prisma.user.findUnique({
            where: { email: emailLower }
          })

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: emailLower,
                emailVerified: new Date(),
                firstName: (profile as any)?.given_name || user.name || 'Usuario',
                lastName: (profile as any)?.family_name || '',
                image: (profile as any)?.picture || user.image || null,
                passwordHash: '',
                role: 'Guest'
              }
            })

            try {
              await sendEmail({
                to: env.ADMIN_EMAIL as string,
                subject: `Nuevo usuario registrado (Google): ${dbUser.firstName} ${dbUser.lastName}`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h3 style="color: #2e7d32;">Nuevo registro automático vía Google</h3>
                    <ul style="line-height: 1.6;">
                      <li><strong>Nombre:</strong> ${dbUser.firstName} ${dbUser.lastName}</li>
                      <li><strong>Email:</strong> ${dbUser.email}</li>
                    </ul>
                  </div>
                `
              })
            } catch (adminEmailError) {
              console.error('Error enviando notificación al admin:', adminEmailError)
            }
          } else {
            const googleImage = (profile as any)?.picture || user.image
            if (!dbUser.image && googleImage && !dbUser.hideGooglePhoto) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { image: googleImage }
              })
            }
          }

          user.id = dbUser.id
          user.role = dbUser.role
          user.phone = dbUser.phone
          return true
        } catch (error) {
          console.error("Error en signIn callback con Google:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = user.phone
      }
      return token
    },
    async session({ session, token }) {
      if (token && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, phone: true, firstName: true, lastName: true, image: true }
        })

        if (session.user) {
          session.user.id = token.id
          session.user.role = dbUser ? dbUser.role : token.role
          session.user.phone = dbUser ? dbUser.phone : token.phone
          session.user.firstName = dbUser?.firstName
          session.user.lastName = dbUser?.lastName
          if (dbUser?.image) {
            session.user.image = dbUser.image
          }
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: env.NEXTAUTH_SECRET,
}
