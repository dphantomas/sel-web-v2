'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                       (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches))
    setIsDark(isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
      setIsDark(true)
    }
  }

  if (!mounted) {
    return (
      <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple transition-colors w-full text-left">
        <div className="w-4 h-4 opacity-50"></div>
        Cargando...
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-sel-body hover:bg-sel-lavender/10 hover:text-sel-purple dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors w-full text-left"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4" />
          <span>Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          <span>Modo Oscuro</span>
        </>
      )}
    </button>
  )
}
