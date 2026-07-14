import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const locales = ['es', 'en']
const defaultLocale = 'es'

function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return 'en'; // Fallback a inglés si no hay header
  
  if (acceptLanguage.toLowerCase().includes('es')) {
    return 'es';
  }
  
  return 'en';
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Ignorar rutas internas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Proteger la ruta /admin
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'Admin') {
      const url = request.nextUrl.clone();
      const locale = getLocale(request) || 'es';
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
    // Si tiene acceso, dejamos pasar (excluido del i18n según plan)
    return NextResponse.next();
  }

  // Toda la lógica de reescritura de rutas limpias a /es/ ahora se maneja
  // en next.config.ts (rewrites) para que sea compatible con next/link en el cliente.
  
  // Si alguien entra a la raíz, detectamos idioma para redireccionar a /en si hace falta
  if (pathname === '/') {
    const locale = getLocale(request);
    if (locale === 'en') {
      request.nextUrl.pathname = `/en`;
      return NextResponse.redirect(request.nextUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
