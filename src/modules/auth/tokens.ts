import crypto from 'crypto'

/**
 * Los tokens de un solo uso (verificación de email, reset de contraseña) se
 * guardan HASHEADOS en la base: un dump de la DB no debe permitir tomar
 * cuentas con los tokens pendientes. El valor plano viaja solo en el email.
 */
export function generateToken() {
  const token = crypto.randomBytes(32).toString('hex')
  return { token, tokenHash: hashToken(token) }
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
