"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";

export function NavbarClient({
  lang,
  session,
  dict,
}: {
  lang: string;
  session: any;
  dict: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);

  const navItems = [
    { href: getLocalizedUrl("/"), label: dict.home || (lang === 'es' ? 'Inicio' : 'Home') },
    { href: getLocalizedUrl("/talleres"), label: dict.workshops || (lang === 'es' ? 'Talleres' : 'Workshops') },
    { href: getLocalizedUrl("/blog"), label: dict.blog || 'Blog' },
    { href: getLocalizedUrl("/videos"), label: dict.videos || 'Videos' },
    { href: getLocalizedUrl("/quienes-somos"), label: dict.about || (lang === 'es' ? 'Quiénes Somos' : 'About Us') },
    { href: getLocalizedUrl("/testimonios"), label: dict.testimonials || (lang === 'es' ? 'Testimonios' : 'Testimonials') },
    { href: getLocalizedUrl("/galeria"), label: dict.gallery || (lang === 'es' ? 'Galería' : 'Gallery') },
    { href: getLocalizedUrl("/contacto"), label: dict.contact || (lang === 'es' ? 'Contacto' : 'Contact') },
  ];

  const isActive = (href: string) => {
    if (href === "/" || href === "/en") return pathname === href || pathname === href + "/";
    return pathname.startsWith(href);
  };

  const isHome = pathname === "/" || pathname === "/en" || pathname === "/es";
  const isLightHeaderPage = ['/login', '/registro', '/verificar-email', '/olvide-contrasena', '/reset-password', '/dashboard', '/admin', '/mis-cursos', '/en/mis-cursos'].some(route => pathname.startsWith(route));
  const hasDarkHeader = !isLightHeaderPage;
  const textColor = (!isScrolled && hasDarkHeader) ? "#ffffff" : "#33275f";
  const borderColor = (!isScrolled && hasDarkHeader) ? "#ffffff" : "#33275f";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'navbar-scrolled py-2' : 'py-3 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
        <a href={getLocalizedUrl("/")} className="shrink-0" title="Home">
          <Image
            src="/assets/logo-sel.png"
            alt="Sanación en Luz"
            width={180}
            height={48}
            priority
            className="h-10 md:h-12 w-auto object-contain transition-all duration-300"
            style={(!isScrolled && hasDarkHeader) ? { filter: 'brightness(0) invert(1)' } : {}}
          />
        </a>

        <div className="hidden lg:flex items-center gap-5 xl:gap-7">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[15px] xl:text-[16px] transition-all duration-300 whitespace-nowrap ${isActive(item.href) ? 'font-bold border-b-2 pb-0.5' : 'font-medium hover:opacity-80'}`}
              style={{
                color: textColor,
                borderColor: isActive(item.href) ? borderColor : 'transparent',
                textShadow: (!isScrolled && hasDarkHeader) ? '0px 2px 4px rgba(0,0,0,0.6)' : 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-2.5 ml-4" style={{ color: textColor }}>
            <div className="h-3.5 w-px bg-current opacity-40"></div>
            <LanguageSwitcher currentLang={lang} textColor="text-inherit" />
            <div className="h-3.5 w-px bg-current opacity-40"></div>
            <UserMenu user={session?.user || null} lang={lang} />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-md transition-colors cursor-pointer"
          style={{ color: textColor, backgroundColor: !isScrolled ? 'rgba(0,0,0,0.15)' : 'transparent' }}
          aria-label="Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white border-t shadow-xl absolute top-full left-0 w-full">
          <div className="flex flex-col py-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                  isActive(item.href) ? 'text-[#b085b3]' : 'text-[#33275f]'
                }`}
              >
                {item.label}
              </a>
            ))}
            
            {/* Mobile Language Switcher & Authentication Links */}
            {session?.user ? (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <a
                  href={lang === 'en' ? '/en/dashboard/perfil' : '/dashboard/perfil'}
                  onClick={() => setIsOpen(false)}
                  className="text-left px-6 py-3 text-sm font-bold transition-colors hover:bg-purple-50 block"
                  style={{ color: '#33275f', textDecoration: 'none' }}
                >
                  {lang === 'en' ? 'My Profile' : 'Mis datos'}
                </a>
                <a
                  href={lang === 'en' ? '/en/mis-cursos' : '/mis-cursos'}
                  onClick={() => setIsOpen(false)}
                  className="text-left px-6 py-3 text-sm font-bold transition-colors hover:bg-purple-50 block"
                  style={{ color: '#33275f', textDecoration: 'none' }}
                >
                  {lang === 'en' ? 'My Workshops' : 'Mis talleres'}
                </a>
                <a
                  href={lang === 'en' ? '/en/dashboard/recursos' : '/dashboard/recursos'}
                  onClick={() => setIsOpen(false)}
                  className="text-left px-6 py-3 text-sm font-bold transition-colors hover:bg-purple-50 block"
                  style={{ color: '#33275f', textDecoration: 'none' }}
                >
                  {lang === 'en' ? 'My Materials' : 'Mis materiales'}
                </a>
                {session.user.role === 'Admin' && (
                  <a
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="text-left px-6 py-3 text-sm font-bold transition-colors hover:bg-purple-50 block"
                    style={{ color: '#B681AE', textDecoration: 'none' }}
                  >
                    {lang === 'en' ? 'Admin Panel' : 'Panel de Admin'}
                  </a>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false)
                    signOut({ callbackUrl: lang === 'en' ? '/en' : '/' })
                  }}
                  className="text-left px-6 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 w-full"
                >
                  {lang === 'en' ? 'Sign Out' : 'Cerrar sesión'}
                </button>
              </div>
            ) : (
              <div className="mt-2 border-t border-gray-100 pt-2">
                <a
                  href={lang === 'en' ? '/en/login' : '/login'}
                  onClick={() => setIsOpen(false)}
                  className="text-left px-6 py-3 text-sm font-bold transition-colors hover:bg-purple-50 block"
                  style={{ color: '#33275f', textDecoration: 'none' }}
                >
                  {lang === 'en' ? 'Sign In' : 'Iniciar Sesión'}
                </a>
              </div>
            )}
            <div className="px-6 py-4 flex flex-col gap-4 border-t mt-2">
              <LanguageSwitcher currentLang={lang} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
