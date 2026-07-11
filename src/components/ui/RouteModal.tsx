'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export function RouteModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.back();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [router]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      router.back();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#33275f]/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-md my-auto"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={() => router.back()}
          className="absolute -top-12 right-0 md:-right-12 md:top-0 text-white hover:text-[#d4aeea] transition-colors"
          aria-label="Cerrar modal"
        >
          <X size={32} />
        </button>
        {children}
      </div>
    </div>
  );
}
