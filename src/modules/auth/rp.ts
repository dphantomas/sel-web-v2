import { env } from '@/env'

/**
 * Origen y RP ID de WebAuthn, fijados desde NEXTAUTH_URL.
 * NUNCA derivarlos de headers del request: el header Host lo controla el
 * cliente, y usarlo como valor "esperado" degrada la verificación de la firma
 * a aceptar el origen que el propio atacante declare.
 */
export function getRelyingParty() {
  const authUrl = env.NEXTAUTH_URL
  if (!authUrl) {
    throw new Error('❌ NEXTAUTH_URL es requerida para WebAuthn/Passkeys (define el origen y el RP ID esperados).')
  }
  const url = new URL(authUrl)
  return { expectedOrigin: url.origin, rpID: url.hostname }
}
