import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

export default function ImageCropperModal({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    try {
      setIsProcessing(true)
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(croppedImageBlob)
    } catch (e) {
      console.error(e)
      alert('Error al recortar la imagen')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-[#33275f]">Recortar Foto de Perfil</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Area */}
        <div className="relative w-full h-[60vh] max-h-[400px] bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls Area */}
        <div className="p-4 space-y-4 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="bg-[#B681AE] hover:bg-[#9187BA] text-white px-6 py-2.5 rounded-xl font-bold transition shadow-sm flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Procesando...
                </>
              ) : (
                'Aceptar'
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
