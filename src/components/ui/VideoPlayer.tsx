'use client';

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function VideoPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !url) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    videoEl.addEventListener('contextmenu', handleContextMenu);

    let hls: Hls | null = null;
    
    // Si la URL es HLS (m3u8) y el navegador no lo soporta de forma nativa (como Safari sí lo hace)
    if (url.includes('.m3u8') && !videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxMaxBufferLength: 30, // Segundos de buffer
        });
        hls.loadSource(url);
        hls.attachMedia(videoEl);
      } else {
        console.error('El navegador no soporta HLS');
      }
    }

    return () => {
      videoEl.removeEventListener('contextmenu', handleContextMenu);
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  if (!url) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-zinc-500 bg-zinc-900">
        Video no disponible
      </div>
    );
  }

  // Detectar YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return (
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${ytMatch[1]}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  // Detectar Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return (
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
        title="Vimeo video player"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Fallback a HTML5 Video seguro para URLs directas o HLS nativo
  // Nota: Safari reproduce .m3u8 de forma nativa a través del src directamente.
  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover focus:outline-none"
      controls
      controlsList="nodownload"
      src={url.includes('.m3u8') ? url : url}
    >
      Tu navegador no soporta la reproducción de video.
    </video>
  );
}
