'use client'


import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Enlace inválido o incompleto. Falta el token de recuperación.' })
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error')
      }

      setMessage({ type: 'success', text: data.message })
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Ocurrió un error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}>
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>
      
      <div className="relative z-10 max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40">
        <div className="text-center">
          <Link href="/">
            <img className="mx-auto h-12 w-auto" src="/assets/logo-sel.png" alt="Sanación en Luz" style={{ filter: 'brightness(0) invert(0)' }} />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-[#33275f]">Nueva Contraseña</h2>
        </div>

        {!token ? (
          <div className="mt-8">
            <div className="p-3 rounded-xl text-sm font-bold text-center bg-red-100 text-red-700">
              {message?.text}
            </div>
            <div className="text-center mt-4">
              <Link href="/olvide-contrasena" className="font-bold text-sm text-[#9187BA] hover:text-[#33275f]">
                Solicitar nuevo enlace
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
                {message.type === 'success' && <p className="mt-2 text-xs">Redirigiendo al login...</p>}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#9187BA] focus:border-[#9187BA] sm:text-sm pr-12"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#9187BA] transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#9187BA] focus:border-[#9187BA] sm:text-sm pr-12"
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#9187BA] transition"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || message?.type === 'success'}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#B681AE] hover:bg-[#9187BA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B681AE] transition disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function ResetPasswordPage() {
  const params = useParams()
  const lang = params?.lang || 'es'
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
