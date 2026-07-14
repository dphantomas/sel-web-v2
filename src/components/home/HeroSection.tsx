"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface HeroSectionProps {
  dict: any;
  lang: string;
  session: any;
}

export function HeroSection({ dict, lang, session }: HeroSectionProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);

  return (
    <div className="bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[75vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background Image using Next.js Image for LCP optimization + JS Parallax */}
        <div 
          className="absolute inset-x-0 top-[-15%] h-[130%] z-0 pointer-events-none"
          style={{ transform: `translateY(${scrollY * 0.4}px)` }}
        >
          <Image 
            src="/assets/el-hoyo-2.jpeg"
            alt="Sanación en Luz - Hero Background"
            fill
            priority
            quality={100}
            className="object-cover object-center z-0"
          />
          {/* Overlay applied directly over the moving image */}
          <div className="absolute inset-0 z-10" style={{ backgroundColor: 'rgba(0,0,0,0.40)' }} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-4 py-20 fade-in mt-4">
          <div className="mb-8 transform transition-transform duration-1000 hover:scale-105">
            <Image
              src="/assets/logo-principal-1.png"
              alt="Sanación en Luz"
              width={650}
              height={300}
              priority
              className="mx-auto w-auto drop-shadow-2xl"
              style={{ maxWidth: '650px', width: '80vw', height: 'auto' }}
            />
          </div>
          <p
            className="text-white text-center drop-shadow-lg max-w-3xl mb-10"
            style={{
              fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
              fontStyle: 'italic',
              fontSize: '22px',
              lineHeight: '1.5em',
              fontWeight: 300,
              letterSpacing: '1px'
            }}
          >
            {dict.heroTagline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!session && (
              <Link
                href={getLocalizedUrl("/login")}
                className="bg-transparent border-2 border-white hover:bg-white text-white hover:text-[#33275f] px-8 py-3 rounded-full font-bold tracking-wide transition-all duration-300 shadow-lg"
              >
                {dict.heroBtn1 || (lang === 'en' ? 'Log In' : 'Ingresar a mi cuenta')}
              </Link>
            )}
          </div>
          
          {/* Scroll down indicator */}
          <div className="absolute bottom-6 animate-bounce cursor-pointer opacity-80 hover:opacity-100 transition-opacity" onClick={() => document.getElementById("process-section")?.scrollIntoView({ behavior: "smooth" })}>
            <Image src="/assets/flecha-blanca.png" alt="Scroll down" width={32} height={32} className="w-8 rotate-90" />
          </div>
        </div>
      </section>
    </div>
  );
}
