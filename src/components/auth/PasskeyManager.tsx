"use client"

import { useState, useEffect } from 'react'
import { Shield, Fingerprint, Trash2, Plus, CheckCircle, Loader2, KeyRound } from 'lucide-react'
import { startRegistration, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Authenticator {
  credentialID: string
  deviceName?: string | null
  createdAt: string
}

interface Message {
  type: 'success' | 'error'
  text: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function PasskeyManager({ initialAuthenticators }: { initialAuthenticators: Authenticator[] }) {
  const [authenticators, setAuthenticators] = useState<Authenticator[]>(initialAuthenticators || [])
  const [isRegistering, setIsRegistering] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isDeviceRegisteredLocally, setIsDeviceRegisteredLocally] = useState(false)

  // Detectar soporte biométrico al montar
  useEffect(() => {
    platformAuthenticatorIsAvailable()
      .then(setIsSupported)
      .catch(() => setIsSupported(false))

    const localId = localStorage.getItem('local_passkey_id')
    if (localId) {
      // Verificar si la passkey local sigue existiendo en la DB
      const exists = initialAuthenticators.some((a: Authenticator) => a.credentialID === localId)
      if (exists) {
        setIsDeviceRegisteredLocally(true)
      } else {
        localStorage.removeItem('local_passkey_id')
        localStorage.removeItem('device_registered')
        setIsDeviceRegisteredLocally(false)
      }
    } else {
      // Si no hay localId, revisamos si tiene la marca genérica (legacy o recuperada)
      setIsDeviceRegisteredLocally(localStorage.getItem('device_registered') === 'true')
    }
  }, [initialAuthenticators])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleRegisterDevice = async () => {
    setIsRegistering(true)
    setMessage(null)

    try {
      const resp = await fetch('/api/auth/webauthn/generate-registration-options')
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.error || 'No se pudo iniciar el registro')
      }
      const options = await resp.json()

      let attResp
      try {
        attResp = await startRegistration(options)
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string }
        if (error.name === 'NotAllowedError') {
          const isCancel = error.message?.toLowerCase().includes('cancel') ||
                           error.message?.toLowerCase().includes('user')
          if (isCancel) {
            setIsRegistering(false)
            return
          }
          throw new Error('El dispositivo no pudo crear la passkey. Verificá que tenga biometría configurada.')
        }
        if (error.name === 'InvalidStateError') {
          // Autorecuperación: Si el SO dice que ya existe, lo marcamos localmente
          localStorage.setItem('device_registered', 'true')
          setIsDeviceRegisteredLocally(true)
          throw new Error('Este dispositivo ya estaba vinculado. Interfaz actualizada.')
        }
        throw new Error(error.message || 'No se pudo crear la passkey en este dispositivo.')
      }

      const verificationResp = await fetch('/api/auth/webauthn/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      })

      const verification = await verificationResp.json()

      if (!verificationResp.ok) {
        throw new Error(verification.error || 'Error al verificar el dispositivo.')
      }

      if (verification.verified) {
        // Marcar en localStorage con el ID exacto
        localStorage.setItem('local_passkey_id', attResp.id)
        localStorage.setItem('device_registered', 'true') // legacy para el login general
        setIsDeviceRegisteredLocally(true)
        
        const emailResp = await fetch('/api/auth/webauthn/list-authenticators')
        if (emailResp.ok) {
          const data = await emailResp.json()
          setAuthenticators(data.authenticators)
        }
        showMessage('success', '¡Passkey agregada! Ahora podés iniciar sesión desde aquí sin contraseña.')
      } else {
        throw new Error('La verificación de la passkey falló.')
      }
    } catch (err: unknown) {
      console.error('Error registrando dispositivo:', err)
      const error = err instanceof Error ? err : new Error('Error al registrar la passkey.')
      showMessage('error', error.message)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleDeleteDevice = async (credentialID: string) => {
    if (!confirm('¿Eliminás esta passkey? Tendrás que volver a configurarla si querés acceder sin contraseña desde ese dispositivo.')) return

    setDeletingId(credentialID)

    try {
      const resp = await fetch('/api/auth/webauthn/delete-authenticator', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialID }),
      })

      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.error || 'Error al eliminar la passkey.')
      }

      const updated = authenticators.filter((a: Authenticator) => a.credentialID !== credentialID)
      setAuthenticators(updated)

      // Si se borró la passkey vinculada a este navegador, limpiamos el localStorage
      const localId = localStorage.getItem('local_passkey_id')
      if (localId === credentialID || updated.length === 0 || !localId) {
        localStorage.removeItem('local_passkey_id')
        localStorage.removeItem('device_registered')
        localStorage.removeItem('registered_email')
        setIsDeviceRegisteredLocally(false)
      }

      showMessage('success', 'Passkey eliminada correctamente.')
    } catch (err: unknown) {
      console.error('Error eliminando dispositivo:', err)
      const error = err instanceof Error ? err : new Error('Error al eliminar la passkey.')
      showMessage('error', error.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40 h-full flex flex-col">
      
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-[#33275f]" />
        <h2 className="text-[#33275f] text-xl font-bold tracking-wide">SEGURIDAD</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">Gestioná tus métodos de ingreso rápido (Passkeys).</p>

      {/* Mensaje de feedback */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Lista de dispositivos registrados */}
      <div className="flex-1">
        {authenticators.length > 0 ? (
          <div className="space-y-3 mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase px-1">Tus Passkeys</h3>
            {authenticators.map((auth: Authenticator) => (
              <div
                key={auth.credentialID}
                className="flex items-center justify-between gap-3 p-3.5 bg-gray-50/70 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#9187BA]/10 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4 text-[#9187BA]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {auth.deviceName || 'Dispositivo desconocido'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Creada el {formatDate(auth.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDevice(auth.credentialID)}
                  disabled={!!deletingId}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                  aria-label="Eliminar passkey"
                >
                  {deletingId === auth.credentialID ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 mb-6">
            <KeyRound className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Sin Passkeys</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
              No tenés configurado el ingreso rápido sin contraseña.
            </p>
          </div>
        )}
      </div>

      {/* Botón para agregar dispositivo */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        
        {isDeviceRegisteredLocally && (
          <div className="w-full flex justify-center items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 py-3 rounded-xl border border-green-200 mb-3">
            <CheckCircle className="w-4 h-4" />
            Este dispositivo ya está vinculado
          </div>
        )}

        {isSupported !== false && !isDeviceRegisteredLocally && (
          <button
            id="add-biometric-device-btn"
            type="button"
            onClick={handleRegisterDevice}
            disabled={isRegistering}
            className="w-full flex justify-center items-center gap-2 text-sm font-semibold text-white bg-[#B681AE] hover:bg-[#9187BA] transition duration-300 rounded-xl py-3 disabled:opacity-50 shadow-md"
          >
            {isRegistering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isRegistering 
              ? 'Configurando Passkey...' 
              : 'Agregar este dispositivo'}
          </button>
        )}

        {isSupported === false && (
          <p className="text-xs text-center text-gray-400 italic">
            Tu dispositivo o navegador actual no soporta passkeys.
          </p>
        )}
      </div>

    </div>
  )
}
