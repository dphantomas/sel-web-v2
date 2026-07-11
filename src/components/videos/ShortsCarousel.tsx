'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatViews } from '@/lib/youtube'

export default function ShortsCarousel({ shorts = [] }: { shorts: any[] }) {
  const [activeShort, setActiveShort] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const closeShort = useCallback(() => setActiveShort(null), [])

  // ESC closes the modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeShort() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [closeShort])

  if (!shorts.length) {
    return (
      <div className="text-center py-16">
        <div className="mb-4" style={{ fontSize: '48px' }}>📱</div>
        <h3
          style={{
            fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
            fontSize: '22px',
            color: '#33275f',
            fontWeight: 400,
            marginBottom: '12px',
          }}
        >
          Próximamente
        </h3>
        <p
          style={{
            fontFamily: "'Open Sans', sans-serif",
            fontSize: '15px',
            color: '#999',
            lineHeight: '1.6em',
          }}
        >
          Aún no hay shorts publicados en el canal.
        </p>
      </div>
    )
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 260
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <>
      <div className="relative">
        {/* Scroll buttons */}
        {shorts.length > 4 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full cursor-pointer transition-all hover:scale-110"
              style={{ backgroundColor: 'rgba(51,39,95,0.8)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full cursor-pointer transition-all hover:scale-110"
              style={{ backgroundColor: 'rgba(51,39,95,0.8)', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {shorts.map((short) => (
            <div
              key={short.id}
              className="short-card flex-shrink-0 cursor-pointer group"
              style={{ width: '220px', scrollSnapAlign: 'start' }}
              onClick={() => setActiveShort(short)}
            >
              {/* Thumbnail (9:16 aspect ratio) */}
              <div
                className="relative overflow-hidden rounded-lg"
                style={{ aspectRatio: '9/16' }}
              >
                <img
                  src={short.thumbnailMedium || short.thumbnail}
                  alt={short.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(51,39,95,0.85)' }}
                  >
                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                  </div>
                </div>
                {/* Shorts badge */}
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold text-white rounded"
                  style={{ backgroundColor: '#ff0000', fontFamily: "'Open Sans', sans-serif" }}
                >
                  SHORT
                </span>
                {/* Views */}
                <span
                  className="absolute bottom-2 left-2 px-2 py-0.5 text-xs text-white rounded flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)', fontFamily: "'Open Sans', sans-serif" }}
                >
                  ▶ {formatViews(short.viewCount)}
                </span>
              </div>

              {/* Title */}
              <p
                className="mt-2 line-clamp-2"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: '13px',
                  color: '#33275f',
                  fontWeight: 600,
                  lineHeight: '1.3em',
                }}
              >
                {short.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Short Modal — vertical YouTube embed */}
      {activeShort && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={closeShort}
        >
          <div
            className="relative w-full max-w-sm mx-auto h-[80vh] flex flex-col items-center bg-black/90 rounded-2xl overflow-hidden animate-modal-content"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeShort}
              className="absolute -top-12 right-0 p-2 rounded-full cursor-pointer transition-colors"
              style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>

            {/* YouTube iframe — vertical aspect ratio for shorts */}
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeShort.id}?autoplay=1&rel=0`}
                title={activeShort.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            {/* Title */}
            <p
              className="mt-3 text-center"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              {activeShort.title}
            </p>
          </div>
        </div>
      )}

      {/* Hide scrollbar CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  )
}
