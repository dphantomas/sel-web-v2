'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const params = useParams()
  const lang = (params?.lang as string) || 'es'

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const getLocalizedUrl = (path: string) => lang === 'es' ? path : `/${lang}${path}`

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const lastRoute = sessionStorage.getItem('lastNonAuthRoute') || `/${lang}/home`
        router.push(lastRoute)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, lang])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    if (formData.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (!acceptTerms) { setError('Debes aceptar la Política de Privacidad para registrarte.'); return }
    
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ocurrió un error al registrarse.')
      setSuccessMessage(data.message || 'Registro exitoso. Revisa tu correo electrónico para activar tu cuenta.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/20">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-[#33275f] text-2xl md:text-3xl font-extrabold tracking-wide text-center">CREAR CUENTA</h2>
        <p className="text-[#666] text-sm mt-2 text-center">Únete a la plataforma de Sanación en Luz</p>
        <div className="w-16 h-[2px] bg-[#9187BA] mt-4"></div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg text-sm">{error}</div>
      )}

      {successMessage ? (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-6 rounded-r-lg text-center space-y-4">
          <h3 className="font-bold text-lg">¡Casi listo!</h3>
          <p>{successMessage}</p>
          <p className="text-sm">Si no lo encuentras, revisa tu carpeta de Spam o Correo no deseado.</p>
          <div className="pt-4">
            <Link href={getLocalizedUrl('/login')} className="inline-block bg-[#9187BA] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#B681AE] transition">
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#33275f] uppercase tracking-wider mb-2">Nombre</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="Juan"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9187BA] focus:border-transparent transition text-gray-800 bg-white/60" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#33275f] uppercase tracking-wider mb-2">Apellido</label>
              <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="Pérez"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9187BA] focus:border-transparent transition text-gray-800 bg-white/60" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#33275f] uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="tuemail@ejemplo.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9187BA] focus:border-transparent transition text-gray-800 bg-white/60" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#33275f] uppercase tracking-wider mb-2">Teléfono (WhatsApp)</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+5491123456789"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9187BA] focus:border-transparent transition text-gray-800 bg-white/60" />
            <span className="text-[11px] text-gray-500 mt-1 block">Incluye código de país para poder enviarte notificaciones.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#33275f] uppercase tracking-wider mb-2">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9187BA] focus:border-transparent transition text-gray-800 bg-white/60 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#9187BA] transition">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#33275f] uppercase tracking-wider mb-2">Repetir Contraseña</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9187BA] focus:border-transparent transition text-gray-800 bg-white/60 pr-12" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#9187BA] transition">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <div className="flex items-center h-5">
              <input id="terms" name="terms" type="checkbox" required checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 text-[#9187BA] bg-white border-gray-300 rounded focus:ring-[#9187BA] focus:ring-2" />
            </div>
            <label htmlFor="terms" className="text-[11px] text-[#666] leading-tight">
              Al registrarme, acepto la{' '}
              <a href="/politica-privacidad" target="_blank" className="text-[#33275f] font-bold hover:underline">Política de Privacidad</a>{' '}
              y el uso de cookies esenciales para el funcionamiento de la plataforma.
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#9187BA] hover:bg-[#B681AE] text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'REGISTRANDO...' : 'REGISTRARSE'}
          </button>
        </form>
      )}

      {!successMessage && (
        <div className="mt-8 text-center text-sm text-[#666]">
          ¿Ya tienes una cuenta?{' '}
          <Link href={getLocalizedUrl('/login')} className="text-[#33275f] font-bold hover:underline transition">Inicia sesión aquí</Link>
        </div>
      )}
    </div>
  )
}
