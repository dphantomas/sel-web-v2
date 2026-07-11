export function parseDeviceName(userAgent: string | null) {
  if (!userAgent) return 'Dispositivo desconocido'
  const ua = userAgent.toLowerCase()

  let browser = 'Navegador'
  if (ua.includes('edg/')) browser = 'Edge'
  else if (ua.includes('chrome') || ua.includes('crios')) browser = 'Chrome'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('firefox') || ua.includes('fxios')) browser = 'Firefox'
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera'

  let os = 'Desconocido'
  if (ua.includes('iphone')) os = 'iPhone'
  else if (ua.includes('ipad')) os = 'iPad'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('mac os')) os = 'Mac'
  else if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('linux')) os = 'Linux'

  if (os === 'Desconocido' && browser === 'Navegador') return userAgent
  if (os === 'Desconocido') return browser

  return `${browser} en ${os}`
}
