'use client'

import { useState, useRef } from 'react'
import { UploadCloud, User as UserIcon } from 'lucide-react'
import ImageCropperModal from '@/components/ImageCropperModal'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { COUNTRIES } from '@/lib/countries'

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function UserProfileForm({ user, hasInitiatoryRetreat }: { user: any, hasInitiatoryRetreat: any }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    addressLine1: user.addressLine1 || '',
    addressLine2: user.addressLine2 || '',
    zipCode: user.zipCode || '',
    country: user.country || '',
    sparkName: user.sparkName || ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<any>(null)
  
  const router = useRouter()
  const { update } = useSession()
  const editFileInputRef = useRef<any>(null)
  const [editImagePreview, setEditImagePreview] = useState(user.image || null)
  const [cropModalImage, setCropModalImage] = useState<any>(null)
  const [croppedImageBlob, setCroppedImageBlob] = useState<any>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const handleEditImageChange = (e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setCropModalImage(reader.result)
      reader.readAsDataURL(file)
    } else {
      setEditImagePreview(user.image || null)
      setCroppedImageBlob(null)
    }
    setRemoveImage(false)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const formPayload = new FormData()
      formPayload.append('firstName', formData.firstName)
      formPayload.append('lastName', formData.lastName)
      formPayload.append('phone', formData.phone)
      formPayload.append('addressLine1', formData.addressLine1)
      formPayload.append('addressLine2', formData.addressLine2)
      formPayload.append('zipCode', formData.zipCode)
      formPayload.append('country', formData.country)
      formPayload.append('sparkName', formData.sparkName)
      if (croppedImageBlob) {
        formPayload.append('image', croppedImageBlob, 'profile.jpg')
      } else if (removeImage) {
        formPayload.append('removeImage', 'true')
      }

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        body: formPayload
      })

      if (!res.ok) {
        throw new Error('Error al actualizar el perfil')
      }

      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente.' })
      
      // Actualizar sesión para reflejar el nuevo nombre/imagen en la Navbar
      await update()
      router.refresh()
      
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'Hubo un error al guardar los cambios.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40 mb-8">
      
      {cropModalImage && (
        <ImageCropperModal
          imageSrc={cropModalImage}
          onCropComplete={(blob: any) => {
            setCroppedImageBlob(blob)
            setEditImagePreview(URL.createObjectURL(blob))
            setCropModalImage(null)
          }}
          onCancel={() => {
            setCropModalImage(null)
            if (editFileInputRef.current) editFileInputRef.current.value = ''
          }}
        />
      )}

      <h2 className="text-[#33275f] text-xl font-bold mb-4 tracking-wide">MI PERFIL</h2>
      
      {message && (
        <div className={`p-3 rounded-xl mb-4 text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Foto de Perfil */}
        <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 mb-2">
          <div className="relative w-24 h-24 shrink-0 rounded-full border-4 border-[#B681AE]/20 bg-white overflow-hidden flex items-center justify-center group">
            {editImagePreview ? (
              <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-gray-300" />
            )}
            
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <UploadCloud className="w-6 h-6 text-white" />
            </div>
            
            <input 
              ref={editFileInputRef}
              type="file" 
              name="image" 
              accept="image/*" 
              onChange={handleEditImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
          </div>
          <div className="text-center sm:text-left">
            <span className="text-lg font-bold text-[#33275f] block mb-1">Foto de Perfil</span>
            <p className="text-sm text-gray-500 mb-2">Hacé clic en la imagen para cambiar tu foto.</p>
            {editImagePreview && (
              <button
                type="button"
                onClick={() => {
                  setEditImagePreview(null)
                  setCroppedImageBlob(null)
                  setRemoveImage(true)
                  if (editFileInputRef.current) editFileInputRef.current.value = ''
                }}
                className="text-xs text-red-500 font-bold hover:underline"
              >
                Eliminar foto
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e: any) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellido</label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e: any) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none"
          />
        </div>
        {(hasInitiatoryRetreat || user.sparkName) && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de Chispa (Opcional)</label>
            <input
              type="text"
              value={formData.sparkName}
              onChange={(e: any) => setFormData({ ...formData, sparkName: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (No editable)</label>
          <input
            type="email"
            disabled
            value={user.email}
            className="w-full px-4 py-2 rounded-xl border bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none"
          />
        </div>
        <div className="md:col-span-2 mt-2">
          <h3 className="text-sm font-bold text-[#33275f] border-b pb-1">Datos Adicionales</h3>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">País</label>
          <select
            value={formData.country}
            onChange={(e: any) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none bg-white"
          >
            <option value="">Seleccioná tu país</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección (Línea 1)</label>
          <input
            type="text"
            value={formData.addressLine1}
            onChange={(e: any) => setFormData({ ...formData, addressLine1: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección (Línea 2) (Opcional)</label>
          <input
            type="text"
            value={formData.addressLine2}
            onChange={(e: any) => setFormData({ ...formData, addressLine2: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código Postal</label>
          <input
            type="text"
            value={formData.zipCode}
            onChange={(e: any) => setFormData({ ...formData, zipCode: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none"
          />
        </div>

        <div className="md:col-span-2 flex justify-end mt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#B681AE] hover:bg-[#9187BA] text-white text-sm font-bold py-2.5 px-6 rounded-xl transition duration-300 shadow-md disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

    </div>
  )
}
