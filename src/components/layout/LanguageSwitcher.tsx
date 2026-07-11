"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LanguageSwitcher({ currentLang, textColor = "text-inherit" }: { currentLang: string, textColor?: string }) {
  const pathname = usePathname();
  
  // Clean current path from locale prefix if it exists
  const cleanPath = pathname.startsWith('/en') ? pathname.replace(/^\/en/, '') : pathname;
  
  // El target de español no lleva prefijo. El target de inglés sí.
  const targetEs = cleanPath || '/';
  const targetEn = `/en${cleanPath}`;

  return (
    <div className={`flex items-center gap-2 border-r border-current pr-4 mr-2 ${textColor}`}>
      <Link 
        href={targetEs} 
        className={`text-xs font-bold transition-colors ${currentLang === 'es' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
      >
        ES
      </Link>
      <span className="opacity-40">|</span>
      <Link 
        href={targetEn} 
        className={`text-xs font-bold transition-colors ${currentLang === 'en' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
      >
        EN
      </Link>
    </div>
  );
}
