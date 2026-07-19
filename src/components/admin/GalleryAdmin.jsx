'use client'

import { useState, useEffect } from 'react'
import { Trash2, GripVertical, Image as ImageIcon, Plus } from 'lucide-react'
import Script from 'next/script'

export default function GalleryAdmin() {
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/gallery')
      if (res.ok) {
        const data = await res.json()
        setImages(data)
      }
    } catch (error) {
      console.error('Error fetching gallery:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que querés borrar esta foto de la galería?')) return

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setImages(images.filter((img) => img.id !== id))
      } else {
        alert('Error al borrar imagen')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const openCloudinaryWidget = async () => {
    try {
      // 1. Obtener folder desde el servidor
      const folderRes = await fetch('/api/admin/cloudinary-sign')
      const { folder, apiKey } = await folderRes.json()

      if (!folder || !apiKey) throw new Error('No se pudieron obtener los parámetros de Cloudinary')

      // 2. Abrir Widget
      window.cloudinary.createUploadWidget(
        {
          cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          apiKey: apiKey, 
          folder: folder,
          multiple: true,
          sources: ['local', 'url', 'camera', 'dropbox', 'onedrive', 'google_drive'],
          language: 'es',
          text: {
            es: {
              or: 'O',
              back: 'Atrás',
              advanced: 'Avanzado',
              close: 'Cerrar',
              no_results: 'Sin resultados',
              search_placeholder: 'Buscar archivos',
              about_uw: 'Acerca del widget',
              menu: {
                custom: 'Personalizado',
                web: 'Dirección Web',
                camera: 'Cámara',
                local: 'Mis Archivos',
                dropbox: 'Dropbox',
                onedrive: 'OneDrive',
              },
              local: {
                browse: 'Buscar',
                dd_title_single: 'Arrastrá una imagen aquí',
                dd_title_multi: 'Arrastrá imágenes aquí',
                drop_title_single: 'Soltá una imagen para subir',
                drop_title_multi: 'Soltá imágenes para subir',
              },
              camera: {
                capture: 'Capturar',
                cancel: 'Cancelar',
                take_pic: 'Tomar foto y subir',
                explanation: 'Asegurate de que tu cámara esté conectada y el navegador tenga permisos.',
              },
              url: {
                inner_title: 'URL pública del archivo',
                input_placeholder: 'http://sitio.com/imagen.jpg',
                upload: 'Subir',
              },
              dropbox: {
                inner_title: 'Subir desde Dropbox',
              },
              queue: {
                title: 'Cola de subida',
                title_uploading_with_counter: 'Subiendo {{num}} archivos',
                title_uploading: 'Subiendo archivos',
                mini_title: 'Subido',
                mini_title_uploading: 'Subiendo',
                show_completed: 'Mostrar completados',
                retry_failed: 'Reintentar fallidos',
                abort_all: 'Cancelar todos',
                upload_more: 'Subir más',
                done: 'Listo',
                mini_upload_count: '{{num}} subidos',
                mini_failed: '{{num}} fallidos',
                statuses: {
                  uploading: 'Subiendo...',
                  error: 'Error',
                  timeout: 'Tiempo agotado',
                  aborted: 'Cancelado',
                },
              },
            },
          },
          clientAllowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
          maxImageFileSize: 5000000,
          uploadSignature: async (callback, params_to_sign) => {
            try {
              const signRes = await fetch('/api/admin/cloudinary-sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paramsToSign: params_to_sign })
              })
              const { signature } = await signRes.json()
              callback(signature)
            } catch (err) {
              console.error('Error al firmar:', err)
            }
          }
        },
        async (error, result) => {
          if (!error && result && result.event === 'success') {
            const { secure_url, public_id } = result.info
            
            // 3. Guardar en DB
            const saveRes = await fetch('/api/admin/gallery', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: secure_url, publicId: public_id, alt: 'Sanación en Luz — Galería' })
            })

            if (saveRes.ok) {
              const newImage = await saveRes.json()
              setImages((prev) => [newImage, ...prev])
            }
          }
        }
      ).open()
    } catch (error) {
      console.error(error)
      alert('Error al inicializar Cloudinary')
    }
  }

  if (isLoading) return <div className="p-6 text-gray-500">Cargando galería...</div>

  return (
    <div className="p-6">
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-[#33275f]">Galería de Fotos</h2>
            <span className="text-sm text-[#33275f] font-bold bg-[#33275f]/10 px-3 py-1.5 rounded-lg border border-[#33275f]/20">
              {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
            </span>
          </div>
          <p className="text-sm text-gray-500">Subí o borrá fotos de la galería pública. Se mostrarán en el mismo orden que las cargues.</p>
        </div>
        <button
          onClick={openCloudinaryWidget}
          className="bg-[#33275f] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#4c3c86] transition shadow-sm flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Subir Fotos
        </button>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay fotos en la galería.</p>
          <button onClick={openCloudinaryWidget} className="text-[#9187BA] font-bold mt-2 hover:underline">Subir la primera foto</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 aspect-square">
              <img src={img.url} alt={img.alt || 'Galería'} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => handleDelete(img.id)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                  title="Borrar foto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
