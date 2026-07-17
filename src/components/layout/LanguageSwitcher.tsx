"use client";

import { usePathname } from "next/navigation";

// El proxy (src/proxy.ts) lee esta cookie para decidir a qué idioma mandar la raíz "/".
// Sin setearla acá, un click en ES que termina navegando a "/" se pisaba enseguida:
// el proxy volvía a mirar Accept-Language y redirigía de nuevo a /en.
function setLocaleCookie(locale: 'es' | 'en') {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LanguageSwitcher({ currentLang, textColor = "text-inherit" }: { currentLang: string, textColor?: string }) {
  const pathname = usePathname();

  // Clean current path from locale prefix if it exists
  const cleanPath = pathname.startsWith('/en') ? pathname.replace(/^\/en/, '') : pathname;

  // El target de español no lleva prefijo. El target de inglés sí.
  const targetEs = cleanPath || '/';
  const targetEn = `/en${cleanPath}`;

  return (
    <div className={`flex items-center gap-1.5 ${textColor}`}>
      {/*
        <a> normal, no next/link: el Link de Next prefetchea "/" en segundo plano
        apenas este componente se monta (antes de cualquier click, con la cookie
        vieja o sin cookie), y al navegar reusa esa respuesta cacheada por el
        router — pisando el cambio de idioma que acabamos de pedir. Una navegación
        dura fuerza un request nuevo que sí pasa por el proxy con la cookie ya puesta.
      */}
      <a
        href={targetEs}
        onClick={() => setLocaleCookie('es')}
        className={`text-xs font-bold transition-colors ${currentLang === 'es' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
      >
        ES
      </a>
      <div className="h-3.5 w-px bg-current opacity-40"></div>
      <a
        href={targetEn}
        onClick={() => setLocaleCookie('en')}
        className={`text-xs font-bold transition-colors ${currentLang === 'en' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
      >
        EN
      </a>
    </div>
  );
}
