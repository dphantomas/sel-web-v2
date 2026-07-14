'use client'

import React, { useEffect } from 'react'

export function SecureVideo({ src }: { src: string }) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <video 
      src={src} 
      controls 
      controlsList="nodownload"
      className="w-full max-h-[80vh] object-contain select-none" 
    />
  )
}

export function SecureAudio({ src }: { src: string }) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <audio 
      src={src} 
      controls 
      controlsList="nodownload"
      className="w-full custom-audio-player select-none" 
    />
  )
}
