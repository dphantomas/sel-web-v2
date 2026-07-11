'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Play, Eye } from 'lucide-react'
import { formatDuration, formatViews } from '@/lib/youtube'

export default function VideoGrid({ videos = [] }: { videos: any[] }) {
  const [activeVideo, setActiveVideo] = useState<any>(null)

  const closeVideo = useCallback(() => setActiveVideo(null), [])

  // ESC closes the video modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeVideo() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [closeVideo])

  if (!videos.length) {
    return (
      <div className="text-center py-16">
        <div className="mb-4" style={{ fontSize: '48px' }}>🎬</div>
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
          Aún no hay videos publicados en el canal.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="video-card cursor-pointer group"
            onClick={() => setActiveVideo(video)}
          >
            {/* Thumbnail */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(51,39,95,0.85)' }}
                >
                  <Play className="w-7 h-7 text-white ml-1" fill="white" />
                </div>
              </div>
              {/* Duration badge */}
              <span
                className="absolute bottom-2 right-2 px-2 py-0.5 text-xs font-semibold text-white rounded"
                style={{ backgroundColor: 'rgba(0,0,0,0.75)', fontFamily: "'Open Sans', sans-serif" }}
              >
                {formatDuration(video.durationSeconds)}
              </span>
            </div>

            {/* Title + meta */}
            <div className="pt-3 pb-1">
              <h3
                className="line-clamp-2"
                style={{
                  fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
                  fontSize: '15px',
                  color: '#33275f',
                  fontWeight: 600,
                  lineHeight: '1.4em',
                  marginBottom: '4px',
                }}
              >
                {video.title}
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center gap-1"
                  style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '12px', color: '#999' }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {formatViews(video.viewCount)}
                </span>
                <span style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '12px', color: '#c2a2e8' }}>
                  {new Date(video.publishedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={closeVideo}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 p-2 rounded-full cursor-pointer transition-colors"
              style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>

            {/* YouTube iframe */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>

            {/* Title below player */}
            <p
              className="mt-3 text-center"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: '16px',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              {activeVideo.title}
            </p>
            <p className="text-center text-white/40 text-xs mt-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              ESC para cerrar
            </p>
          </div>
        </div>
      )}
    </>
  )
}
