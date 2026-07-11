'use client'

import { useRouter } from 'next/navigation'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegistroPage() {
  const router = useRouter()

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const langMatch = window.location.pathname.match(/^\/([a-z]{2})/);
      const lang = langMatch ? langMatch[1] : 'es';
      const lastRoute = sessionStorage.getItem('lastNonAuthRoute') || `/${lang}/home`
      router.push(lastRoute)
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="flex-1 flex items-center justify-center bg-cover bg-center bg-fixed px-4 py-12 relative cursor-pointer"
      style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')", backgroundColor: '#33275f' }}
    >
      <div className="absolute inset-0 bg-[#33275f]/40 backdrop-blur-[2px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md cursor-default" onClick={(e) => e.stopPropagation()}>
        <RegisterForm />
      </div>
    </div>
  )
}
