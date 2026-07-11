'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 8

export default function Gallery({ lang = 'es', initialImages = [] }: { lang?: string, initialImages?: any[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [failed, setFailed] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visible = initialImages.filter((img) => !failed.has(img.id))
  const displayed = visible.slice(0, visibleCount)
  const hasMore = visibleCount < visible.length

  const handleError = (id: string) => setFailed((prev) => new Set(prev).add(id))
  const openLightbox = (idx: number) => setLightboxIndex(idx)
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback((e?: any) => {
    e?.stopPropagation()
    setLightboxIndex((i) => i !== null ? (i - 1 + displayed.length) % displayed.length : null)
  }, [displayed.length])

  const goNext = useCallback((e?: any) => {
    e?.stopPropagation()
    setLightboxIndex((i) => i !== null ? (i + 1) % displayed.length : null)
  }, [displayed.length])

  // ESC key closes lightbox
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft' && lightboxIndex !== null) goPrev()
      if (e.key === 'ArrowRight' && lightboxIndex !== null) goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, closeLightbox, goPrev, goNext])

  return (
    <section id="galeria" className="bg-white pb-16">

      {/* Section header */}
      <div
        className="section-header-bg flex flex-col items-center justify-center"
        style={{ minHeight: '160px', paddingTop: '60px', paddingBottom: '20px' }}
      >
        <h2 
          className="text-white text-[28px] md:text-[34px] tracking-[5px] md:tracking-[10px] font-light text-center pl-[5px] md:pl-[10px]"
          
        >
          {lang === 'en' ? 'Gallery' : 'Galería'}
        </h2>
      </div>

      {/* Main content area with parallax background */}
      <div 
        className="relative pt-8 pb-16 md:pt-10 md:pb-24 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/10"></div> 

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6">
          {/* Arrow ornament */}
          <div className="text-center mb-16">
            <img
              src="/assets/flecha2.png"
              alt=""
              style={{ width: '60px', height: 'auto', margin: '0 auto' }}
            />
          </div>

      {/* Intro text */}
      <div className="text-center max-w-2xl mx-auto px-6 mb-10">
        <p style={{ fontFamily: "'Open Sans', Arial, sans-serif", fontSize: '15px', color: '#666', lineHeight: '1.7em' }}>
          {lang === 'en'
            ? 'Shared moments from Sanación en Luz workshops, retreats and gatherings.'
            : 'Momentos compartidos en encuentros, talleres y retiros de Sanación en Luz.'}
        </p>
      </div>

      {/* Image grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayed.map((img, idx) => (
            <div
              key={img.id}
              className="gallery-item relative group rounded-xl overflow-hidden cursor-pointer shadow-sm aspect-square"
              onClick={() => openLightbox(idx)}
              title={lang === 'en' ? 'View image' : 'Ver imagen'}
            >
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 block"
                onError={() => handleError(img.id)}
              />
              <div className="gallery-overlay absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {displayed.length === 0 && (
          <p className="text-center py-10" style={{ color: '#b085b3', fontFamily: "'Open Sans', sans-serif" }}>
            {lang === 'en' ? 'Loading gallery…' : 'Cargando galería…'}
          </p>
        )}

        {/* Load more button */}
        {hasMore && (
          <div className="text-center mt-10">
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="cursor-pointer px-8 py-3 transition-all duration-200 hover:opacity-90 hover:scale-105"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: '#fff',
                backgroundColor: '#33275f',
                border: 'none',
                boxShadow: '0 4px 14px rgba(51,39,95,0.25)',
              }}
            >
              {lang === 'en' ? 'Load more photos' : 'Cargar más fotos'}
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && displayed[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={closeLightbox}
        >
          {/* Prev */}
          <button
            onClick={goPrev}
            className="absolute left-4 md:left-8 p-3 rounded-full cursor-pointer transition-colors z-10"
            style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}
            aria-label={lang === 'en' ? 'Previous image' : 'Imagen anterior'}
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Image */}
          <div className="relative max-w-5xl max-h-[90vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={displayed[lightboxIndex].url}
              alt={displayed[lightboxIndex].alt}
              className="max-w-full max-h-[85vh] object-contain"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            />
            {/* Counter + ESC hint */}
            <p className="text-center text-white/50 text-xs mt-3" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {lightboxIndex + 1} / {displayed.length}
              <span className="ml-4 opacity-60">ESC {lang === 'en' ? 'to close' : 'para cerrar'}</span>
            </p>
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            className="absolute right-4 md:right-8 p-3 rounded-full cursor-pointer transition-colors z-10"
            style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}
            aria-label={lang === 'en' ? 'Next image' : 'Imagen siguiente'}
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full cursor-pointer"
            style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}
            aria-label={lang === 'en' ? 'Close' : 'Cerrar'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </section>
  )
}
