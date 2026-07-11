'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function RouteHistorySaver() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (!pathname.includes('/login') && !pathname.includes('/registro') && !pathname.includes('/olvide-contrasena')) {
      sessionStorage.setItem('lastNonAuthRoute', pathname)
    }
  }, [pathname])

  return null
}
