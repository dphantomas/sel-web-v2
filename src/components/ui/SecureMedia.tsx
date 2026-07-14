'use client'

import React from 'react'

export function SecureVideo({ src }: { src: string }) {
  return (
    <video 
      src={src} 
      controls 
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
      className="w-full max-h-[80vh] object-contain" 
    />
  )
}

export function SecureAudio({ src }: { src: string }) {
  return (
    <audio 
      src={src} 
      controls 
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
      className="w-full custom-audio-player" 
    />
  )
}
