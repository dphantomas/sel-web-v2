'use client'


import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function VerificationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const status = searchParams.get('status') || (token ? 'redirecting' : 'loading')
  const message = searchParams.get('message') || ''
  const lang = searchParams.get('lang') || 'es'

  useEffect(() => {
    // Si viene de un correo viejo que solo tenía ?token=..., redirigimos a la nueva ruta
    if (token && !searchParams.get('status')) {
      window.location.href = `/api/auth/verify?token=${token}`
    }
  }, [token, searchParams])

  return (
    <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/20 text-center">
      
      {(status === 'loading' || status === 'redirecting') && (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-16 h-16 text-[#9187BA] animate-spin" />
          <h2 className="text-[#33275f] text-2xl font-extrabold tracking-wide">
            Verificando...
          </h2>
          <p className="text-[#666]">
            {status === 'redirecting' ? 'Redirigiendo al sistema seguro...' : 'Estamos confirmando tu correo electrónico.'}
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
          <h2 className="text-[#33275f] text-2xl font-extrabold tracking-wide">
            ¡Cuenta Activada!
          </h2>
          <p className="text-[#666]">
            {message}
          </p>
          <div className="pt-6 w-full">
            <Link 
              href={`/${lang}/login`}
              className="block w-full bg-[#9187BA] hover:bg-[#B681AE] text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center space-y-4">
          <XCircle className="w-20 h-20 text-red-500" />
          <h2 className="text-[#33275f] text-2xl font-extrabold tracking-wide">
            Error de Verificación
          </h2>
          <p className="text-[#666]">
            {message}
          </p>
          <div className="pt-6 w-full space-y-3">
            <Link 
              href={`/${lang}/registro`}
              className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transition duration-300"
            >
              Volver al Registro
            </Link>
            <Link 
              href={`/${lang}/login`}
              className="block text-[#9187BA] hover:underline text-sm font-semibold"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}

export default function VerificarEmailPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed px-4 py-12"
      style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}
    >
      <div className="absolute inset-0 bg-[#33275f]/40 backdrop-blur-[2px]"></div>
      
      <Suspense fallback={
        <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-[24px] shadow-lg text-center">
          <Loader2 className="w-16 h-16 text-[#9187BA] animate-spin mx-auto" />
          <p className="mt-4 text-[#33275f] font-bold">Cargando...</p>
        </div>
      }>
        <VerificationContent />
      </Suspense>
    </div>
  )
}
