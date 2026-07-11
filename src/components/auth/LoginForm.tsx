'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Fingerprint, Loader2 } from 'lucide-react'
import { startAuthentication, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const lang = (params?.lang as string) || 'es'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [savedEmail, setSavedEmail] = useState<string | null>(null)
  const [biometricLoading, setBiometricLoading] = useState(false)

  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      setSuccess('¡Registro completado con éxito! Por favor inicia sesión.')
    }
  }, [searchParams])

  useEffect(() => {
    async function checkBiometric() {
      try {
        const isDeviceRegistered = localStorage.getItem('device_registered') === 'true'
        const storedEmail = localStorage.getItem('registered_email')
        const isSupported = await platformAuthenticatorIsAvailable()
        if (isDeviceRegistered && storedEmail && isSupported) {
          setBiometricAvailable(true)
          setSavedEmail(storedEmail)
          setEmail(storedEmail)
        }
      } catch { }
    }
    checkBiometric()
  }, [])

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

  const handleBiometricLogin = async () => {
    setBiometricLoading(true)
    setError('')
    try {
      const optionsResp = await fetch('/api/auth/webauthn/generate-authentication-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail }),
      })
      if (!optionsResp.ok) {
        const data = await optionsResp.json()
        throw new Error(data.error || 'No se pudo iniciar la autenticación biométrica.')
      }
      const options = await optionsResp.json()
      let assertion
      try {
        assertion = await startAuthentication(options)
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          const isCancel = err.message?.toLowerCase().includes('cancel') || err.message?.toLowerCase().includes('user')
          if (isCancel) { setBiometricLoading(false); return }
          throw new Error('Este dispositivo no tiene la passkey registrada. Registralo desde tu Perfil.')
        }
        if (err.name === 'NotSupportedError') throw new Error('Tu navegador no soporta passkeys. Intentá con Chrome o Safari.')
        if (err.name === 'SecurityError') throw new Error('Error de seguridad. Verificá que estés usando HTTPS.')
        throw new Error(err.message || 'Error al leer la passkey del dispositivo.')
      }
      const result = await signIn('credentials', {
        redirect: false,
        email: savedEmail,
        assertion: JSON.stringify(assertion),
      })
      if (result?.error) {
        if (result.error.includes('Dispositivo no reconocido') || result.error.includes('expirado') || result.error.includes('no está registrado')) {
          localStorage.removeItem('device_registered')
          localStorage.removeItem('registered_email')
          setBiometricAvailable(false)
          setSavedEmail(null)
        }
        throw new Error(result.error)
      }
      router.push(`/${lang}/home`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error al autenticar con biometría.')
    } finally {
      setBiometricLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await signIn('credentials', { redirect: false, email, password })
      if (result?.error) throw new Error(result.error || 'Credenciales incorrectas.')
      router.push(`/${lang}/home`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getLocalizedUrl = (path: string) => lang === 'es' ? path : `/${lang}${path}`

  return (
    <div className="w-full bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/20">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-[#33275f] text-2xl md:text-3xl font-extrabold tracking-wide text-center">
          INICIAR SESIÓN
        </h2>
        <p className="text-[#666] text-sm mt-2 text-center">
          Ingresá a tu espacio de Sanación en Luz
        </p>
        <div className="w-16 h-[2px] bg-[#9187BA] mt-4"></div>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg text-sm">
          {error}
        </div>
      )}

      {biometricAvailable && (
        <div className="mb-6">
          <button
            id="biometric-login-btn"
            onClick={handleBiometricLogin}
            disabled={biometricLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#33275f] to-[#4c3c86] hover:from-[#4c3c86] hover:to-[#5e4a9e] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {biometricLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Fingerprint className="w-5 h-5" />}
            {biometricLoading ? 'Verificando...' : 'Ingresar con passkey'}
          </button>
          <p className="text-[11px] text-center text-[#888] mt-2">
            Passkey de <span className="font-semibold text-[#33275f]">{savedEmail}</span>
          </p>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400">o ingresá con contraseña</span>
            </div>
          </div>
        </div>
      )}

      {!biometricAvailable && (
        <div className="mb-6">
          <button
            id="google-login-btn"
            onClick={() => { setLoading(true); signIn('google', { callbackUrl: `/${lang}/home` }) }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-xl transition duration-300 shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 21.53 7.7 24 12 24z" />
              <path fill="#FBBC05" d="M5.84 15.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V8.06H2.18C1.43 9.55 1 11.22 1 13s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 4.63c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.18 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
          <p className="text-[10px] text-center text-[#666] mt-3">
            Al iniciar sesión o registrarte, aceptás nuestra{' '}
            <a href="/politica-privacidad" target="_blank" className="text-[#33275f] font-bold hover:underline">Política de Privacidad</a>.
          </p>
        </div>
      )}

      {biometricAvailable && (
        <div className="mb-5">
          <button
            onClick={() => { setLoading(true); signIn('google', { callbackUrl: `/${lang}/home` }) }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl transition duration-300 shadow-sm disabled:opacity-50 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 21.53 7.7 24 12 24z" />
              <path fill="#FBBC05" d="M5.84 15.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V8.06H2.18C1.43 9.55 1 11.22 1 13s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 4.63c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.18 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>
        </div>
      )}

      {!biometricAvailable && (
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O ingresá con tu correo</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-[#33275f] uppercase tracking-wider mb-2">Correo Electrónico</label>
          <input
            id="email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tuemail@ejemplo.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9187BA] focus:border-transparent transition text-gray-800 bg-white/60"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-[#33275f] uppercase tracking-wider">Contraseña</label>
            <Link href={getLocalizedUrl('/olvide-contrasena')} className="text-xs text-[#9187BA] font-bold hover:underline transition">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9187BA] focus:border-transparent transition text-gray-800 bg-white/60 pr-12"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#9187BA] transition">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button
          id="password-login-btn"
          type="submit"
          disabled={loading}
          className="w-full bg-[#9187BA] hover:bg-[#B681AE] text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-[#666]">
        ¿Todavía no tenés cuenta?{' '}
        <Link href={getLocalizedUrl('/registro')} className="text-[#33275f] font-bold hover:underline transition">
          Registrate aquí
        </Link>
      </div>
    </div>
  )
}
