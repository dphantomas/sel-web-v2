'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LogOut, BookOpen, Settings, User, LogIn, Shield, Folder } from 'lucide-react';

export function UserMenu({ 
  user, 
  lang 
}: { 
  user: { name?: string | null, email?: string | null, image?: string | null, role?: string } | null,
  lang: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocalizedUrl = (path: string) => {
    if (lang === 'es') return path;
    return `/${lang}${path}`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
      >

        <div className="w-9 h-9 flex-shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden ring-2 ring-zinc-100 dark:ring-zinc-800">
          {user ? (
            user.image ? (
              <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
              </span>
            )
          ) : (
            <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div style={{ right: 0 }} className="absolute top-full mt-3 w-64 origin-top-right bg-white rounded-xl shadow-[0_10px_30px_rgba(51,39,95,0.15)] border border-gray-100 overflow-hidden z-[100] transform transition-all">
          {user ? (
            <>
              <div className="px-5 py-4 border-b border-gray-100 bg-[#fefdff] text-center">
                <p className="text-sm font-bold truncate" style={{ color: '#33275f', fontFamily: "'Lato', sans-serif" }}>
                  {user.name || user.email}
                </p>
                {user.name && (
                  <p className="text-xs truncate" style={{ color: '#666', fontFamily: "'Open Sans', sans-serif" }}>
                    {user.email}
                  </p>
                )}
              </div>
              <div className="p-2">
                <a 
                  href={getLocalizedUrl('/dashboard/perfil')} 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors group"
                  style={{ color: '#666666', fontFamily: "'Open Sans', sans-serif", textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f6fc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: '#2ea3f2' }} />
                  <span className="font-medium group-hover:text-[#33275f] transition-colors">{lang === 'en' ? 'My Profile' : 'Mis datos'}</span>
                </a>

                <a 
                  href={getLocalizedUrl('/mis-cursos')} 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors group mt-1"
                  style={{ color: '#666666', fontFamily: "'Open Sans', sans-serif", textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f6fc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <BookOpen className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: '#2ea3f2' }} />
                  <span className="font-medium group-hover:text-[#33275f] transition-colors">{lang === 'en' ? 'My Workshops' : 'Mis talleres'}</span>
                </a>

                <a 
                  href={getLocalizedUrl('/dashboard/recursos')} 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors group mt-1"
                  style={{ color: '#666666', fontFamily: "'Open Sans', sans-serif", textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f6fc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Folder className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: '#2ea3f2' }} />
                  <span className="font-medium group-hover:text-[#33275f] transition-colors">{lang === 'en' ? 'My Materials' : 'Mis materiales'}</span>
                </a>

                
                {user.role === 'Admin' && (
                  <a 
                    href="/admin" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors group mt-1"
                    style={{ color: '#666666', fontFamily: "'Open Sans', sans-serif", textDecoration: 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f6fc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Settings className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: '#b085b3' }} />
                    <span className="font-medium group-hover:text-[#33275f] transition-colors">{lang === 'en' ? 'Admin Panel' : 'Panel Admin'}</span>
                  </a>
                )}
              </div>
              <div className="p-2 border-t border-gray-100 bg-[#faf9fc]">
                <button 
                  onClick={() => signOut({ callbackUrl: getLocalizedUrl('/') })}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors group text-left"
                  style={{ color: '#e53e3e', fontFamily: "'Open Sans', sans-serif" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="font-medium">{lang === 'en' ? 'Sign Out' : 'Cerrar Sesión'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-2">
              <a 
                href={getLocalizedUrl('/login')} 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors group"
                style={{ color: '#33275f', fontFamily: "'Open Sans', sans-serif", textDecoration: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f6fc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogIn className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: '#b085b3' }} />
                <span>{lang === 'en' ? 'Sign In' : 'Iniciar Sesión'}</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
