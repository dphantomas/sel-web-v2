"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { startRegistration, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser'
import { Fingerprint, X, CheckCircle } from 'lucide-react'

/**
 * PasskeyPrompt
 *
 * Banner global que se monta en el layout.
 * Aparece en cualquier página cuando el usuario está autenticado,
 * tiene un dispositivo compatible y todavía no registró su passkey.
 *
 * Lógica de estados (localStorage):
 *   device_registered=true   → ya tiene passkey, no mostrar
 *   biometricDismissed=true  → eligió "No, gracias", no volver a ofrecer automáticamente
 *   (ninguno)                → mostrar banner si el hardware lo soporta
 */
export default function PasskeyPrompt() {
  const { data: session, status } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [animate, setAnimate] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Solo correr si el usuario está autenticado
    if (status !== 'authenticated' || !session?.user) return

    async function check() {
      try {
        if (localStorage.getItem('device_registered') === 'true') return
        if (localStorage.getItem('biometricDismissed') === 'true') return

        const isSupported = await platformAuthenticatorIsAvailable()
        if (!isSupported) return

        // Mostrar con pequeño delay para que no choque con la carga de la página
        setTimeout(() => {
          setIsVisible(true)
          setTimeout(() => setAnimate(true), 50)
        }, 1200)
      } catch {
        // No mostrar si hay cualquier error de detección
      }
    }

    check()
  }, [status, session])

  const handleDismiss = () => {
    localStorage.setItem('biometricDismissed', 'true')
    setAnimate(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  const handleRegister = async () => {
    setIsRegistering(true)
    setError(null)

    try {
      // 1. Opciones de registro del servidor
      const resp = await fetch('/api/auth/webauthn/generate-registration-options')
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.error || 'No se pudo iniciar el registro.')
      }
      const options = await resp.json()

      // 2. Registro en el dispositivo (dispara Face ID / Touch ID / Windows Hello)
      let attResp
      try {
        attResp = await startRegistration(options)
      } catch (err: unknown) {
        const webAuthnErr = err as { name?: string; message?: string }
        if (webAuthnErr.name === 'NotAllowedError') {
          const isCancel =
            webAuthnErr.message?.toLowerCase().includes('cancel') ||
            webAuthnErr.message?.toLowerCase().includes('user')
          if (isCancel) {
            setIsRegistering(false)
            return
          }
          throw new Error('El dispositivo no pudo crear la passkey. Verificá que tenga biometría configurada.')
        }
        if (webAuthnErr.name === 'InvalidStateError') {
          // Ya tiene una passkey → marcarla como registrada y cerrar
          localStorage.setItem('device_registered', 'true')
          if (session?.user?.email) {
            localStorage.setItem('registered_email', session.user.email)
          }
          setSuccess(true)
          setTimeout(() => { setAnimate(false); setTimeout(() => setIsVisible(false), 300) }, 3000)
          return
        }
        throw new Error(webAuthnErr.message || 'No se pudo crear la passkey.')
      }

      // 3. Verificar en el servidor
      const verificationResp = await fetch('/api/auth/webauthn/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      })

      const verification = await verificationResp.json()

      if (!verificationResp.ok) {
        throw new Error(verification.error || 'Error del servidor al validar el dispositivo.')
      }

      if (verification.verified) {
        localStorage.setItem('device_registered', 'true')
        if (session?.user?.email) {
          localStorage.setItem('registered_email', session.user.email)
        }
        setSuccess(true)
        setTimeout(() => {
          setAnimate(false)
          setTimeout(() => setIsVisible(false), 300)
        }, 3000)
      } else {
        throw new Error('La verificación del dispositivo falló.')
      }
    } catch (err: unknown) {
      console.error('PasskeyPrompt error:', err)
      const error = err instanceof Error ? err.message : 'Ocurrió un error al crear la passkey.'
      setError(error)
    } finally {
      setIsRegistering(false)
    }
  }

  if (!isVisible) return null

  return (
    // Overlay fijo en la parte inferior — como los bancos en móvil
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 pointer-events-none">
      <div
        className={`
          pointer-events-auto
          max-w-md mx-auto
          relative overflow-hidden rounded-2xl text-white
          bg-gradient-to-br from-[#33275f] via-[#3d3070] to-[#4c3c86]
          border border-white/10 shadow-2xl
          transition-all duration-300 ease-out
          ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        {/* Decoración */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-[#B681AE]/10 pointer-events-none" />

        <div className="relative z-10 p-5">
          {success ? (
            <div className="flex items-center gap-3 py-1">
              <CheckCircle className="w-7 h-7 text-green-400 shrink-0" />
              <div>
                <p className="font-bold text-green-300">¡Passkey creada!</p>
                <p className="text-sm text-gray-300 mt-0.5">
                  La próxima vez podés entrar al instante sin contraseña.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#B681AE]/30 flex items-center justify-center shrink-0">
                    <Fingerprint className="w-5 h-5 text-[#d4a8d0]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">
                      Activá tu passkey en este dispositivo
                    </h3>
                    <p className="text-gray-300 text-xs mt-0.5">
                      Ingresá sin contraseña, como los bancos.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  disabled={isRegistering}
                  className="text-white/40 hover:text-white/80 transition shrink-0 mt-0.5"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-xs p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="passkey-prompt-register-btn"
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="bg-white text-[#33275f] hover:bg-gray-100 font-bold text-sm py-2.5 px-5 rounded-xl transition duration-300 shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#33275f]/30 border-t-[#33275f] rounded-full animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Fingerprint size={16} />
                      Sí, crear passkey
                    </>
                  )}
                </button>
                <button
                  id="passkey-prompt-dismiss-btn"
                  onClick={handleDismiss}
                  disabled={isRegistering}
                  className="text-white/70 hover:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition duration-300 hover:bg-white/10 disabled:opacity-50"
                >
                  No, gracias
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
