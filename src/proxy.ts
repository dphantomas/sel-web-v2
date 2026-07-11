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

  // Si alguien entra a /es/... lo redirigimos a /... (para que ES no tenga prefijo)
  if (pathname.startsWith('/es/') || pathname === '/es') {
    request.nextUrl.pathname = pathname.replace(/^\/es/, '') || '/';
    return NextResponse.redirect(request.nextUrl);
  }

  // Si ya tiene el prefijo /en/, lo dejamos pasar normalmente
  if (pathname.startsWith('/en/') || pathname === '/en') {
    return NextResponse.next();
  }
 
  // Llegados a este punto, la ruta NO tiene prefijo de idioma (es una ruta "limpia" como /cursos o /).
  // Solo en la raíz (/) hacemos detección de idioma activa y redireccionamos si es necesario.
  if (pathname === '/') {
    const locale = getLocale(request);
    if (locale === 'en') {
      request.nextUrl.pathname = `/en`;
      return NextResponse.redirect(request.nextUrl);
    }
  }

  // Para el resto de rutas sin prefijo, o si la raíz detectó español, asumimos que es el defaultLocale (es).
  // Hacemos un REWRITE (no redirect) para que internamente Next.js procese app/[lang] con lang='es'.
  request.nextUrl.pathname = `/es${pathname}`;
  return NextResponse.rewrite(request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
