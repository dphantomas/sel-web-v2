import { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { sendEmail } from '@/modules/auth/email'
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

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase().trim() },
        include: { authenticators: true }
      })

      if (!user) {
        throw new Error('El correo ingresado no está registrado.')
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

        const host = req.headers?.host || 'localhost:3000'
        // El tipado de req en authorize de CredentialsProvider puede no incluir headers explícitamente a veces en V4
        // Usaremos una aserción segura o un fallback
        const protocol = req.headers?.['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')
        const expectedOrigin = req.headers?.origin || `${protocol}://${host}`
        const expectedRPID = host.split(':')[0]

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

      if (!user.passwordHash) {
        throw new Error('El correo no tiene contraseña registrada.')
      }

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

      if (!isValid) {
        throw new Error('Contraseña incorrecta.')
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
                to: 'admin@dgg-master.com', // Ajustar según config
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
