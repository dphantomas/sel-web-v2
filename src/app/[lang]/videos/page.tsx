'use client'

import { useState, useEffect } from 'react'
import VideoGrid from '@/components/videos/VideoGrid'
import ShortsCarousel from '@/components/videos/ShortsCarousel'

export default function VideosPage() {
  const [channel, setChannel] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [shorts, setShorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/videos')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (!data || !data.channel) throw new Error('Invalid data')
        setChannel(data.channel)
        setVideos(data.videos || [])
        setShorts(data.shorts || [])
      } catch (e) {
        console.error('[Videos] Failed to load:', e)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <section className="bg-[#fcfbfe]">

      {/* Section header */}
      <div
        className="section-header-bg flex flex-col items-center justify-center"
        style={{ minHeight: '160px', paddingTop: '60px', paddingBottom: '20px' }}
      >
        <h1 className="text-white text-[28px] md:text-[34px] tracking-[5px] md:tracking-[10px] font-light text-center pl-[5px] md:pl-[10px]">
          Videos
        </h1>
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

          {/* Channel link */}
          <div className="text-center mb-12">
            <a
              href={channel?.channelUrl || 'https://www.youtube.com/@SanacionEnLuz'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: '#ff0000',
                color: '#fff',
                fontFamily: "'Lato', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(255,0,0,0.25)',
              }}
            >
              <svg width="20" height="14" viewBox="0 0 24 17" fill="white">
                <path d="M23.5 2.5C23.2 1.4 22.3.5 21.2.2 19.3 0 12 0 12 0S4.7 0 2.8.2C1.7.5.8 1.4.5 2.5.2 4.4 0 8.5 0 8.5s.2 4.1.5 6c.3 1.1 1.2 2 2.3 2.3C4.7 17 12 17 12 17s7.3 0 9.2-.2c1.1-.3 2-1.2 2.3-2.3.3-1.9.5-6 .5-6s-.2-4.1-.5-6z"/>
                <polygon points="9.6,4.9 9.6,12.1 15.8,8.5" fill="#fff"/>
              </svg>
              Ir al canal de YouTube
              {channel?.subscriberCount && parseInt(channel.subscriberCount) > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  {parseInt(channel.subscriberCount).toLocaleString('es-AR')} suscriptores
                </span>
              )}
            </a>
          </div>

          <div className="pb-16">

            {/* Loading state */}
            {loading && (
              <div className="text-center py-20">
                <div
                  className="inline-block w-10 h-10 border-4 rounded-full animate-spin mb-4"
                  style={{ borderColor: '#d4aeea', borderTopColor: '#33275f' }}
                />
                <p style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '15px', color: '#999' }}>
                  Cargando videos del canal...
                </p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="text-center py-20">
                <p style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '15px', color: '#999' }}>
                  No se pudieron cargar los videos. Visitá nuestro{' '}
                  <a
                    href="https://www.youtube.com/@SanacionEnLuz"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2ea3f2', textDecoration: 'underline' }}
                  >
                    canal de YouTube
                  </a>{' '}
                  directamente.
                </p>
              </div>
            )}

            {/* Content loaded */}
            {!loading && !error && (
              <>
                {/* ==================== VIDEOS ==================== */}
                <div className="mb-16">
                  <h2
                    className="mb-8 text-center"
                    style={{
                      fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
                      fontSize: '24px',
                      color: '#33275f',
                      fontWeight: 400,
                      letterSpacing: '1px',
                    }}
                  >
                    Videos
                  </h2>
                  <VideoGrid videos={videos} />
                </div>

                {/* ==================== SHORTS ==================== */}
                <div>
                  <h2
                    className="mb-8 text-center"
                    style={{
                      fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
                      fontSize: '24px',
                      color: '#33275f',
                      fontWeight: 400,
                      letterSpacing: '1px',
                    }}
                  >
                    Shorts
                  </h2>
                  <ShortsCarousel shorts={shorts} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
