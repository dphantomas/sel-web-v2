'use client'


import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const params = useParams()
  const lang = params?.lang || 'es'
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error')
      }

      setMessage({ type: 'success', text: data.message })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Ocurrió un error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-cover bg-center bg-fixed px-4 py-12" style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}>
      <div className="absolute inset-0 bg-white/70" style={{ backdropFilter: 'blur(2px)' }}></div>

      <div className="relative z-10 w-full max-w-md bg-white p-8 md:p-10 border border-gray-100" style={{ borderRadius: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <div className="text-center">
          <Link href="/">
            <img className="mx-auto h-12 w-auto" src="/assets/logo-sel.png" alt="Sanación en Luz" style={{ filter: 'brightness(0) invert(0)' }} />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-[#33275f]">Recuperar Contraseña</h2>
          <p className="mt-2 text-sm text-gray-600">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor="email" className="sr-only">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full bg-[#f8f7fa] border border-[#e2ddea] text-[#33275f] text-sm rounded-lg focus:ring-[#9187BA] focus:border-[#9187BA] block p-3.5 transition duration-300"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white bg-[#9187BA] hover:bg-[#7A6FAA] focus:ring-4 focus:outline-none focus:ring-[#9187BA]/50 font-bold rounded-lg text-sm px-5 py-3.5 text-center transition duration-300 shadow-md hover:shadow-lg disabled:opacity-70 flex justify-center items-center"
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <Link href={`/${lang}/login`} className="font-bold text-sm text-[#9187BA] hover:text-[#33275f]">
              Volver al Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
