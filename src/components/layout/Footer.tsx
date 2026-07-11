"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer({ lang }: { lang: string }) {
  const pathname = usePathname();

  return (
    <footer className="py-12 bg-gradient-to-r from-[#d4aeea] to-[#fefdff]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Footer Logo */}
        <div className="flex justify-center mb-8">
          <Link href={lang === "en" ? "/en" : "/"}>
            <Image
              src="/assets/logo-sel-footer-1.png"
              alt="Sanación en Luz"
              width={245}
              height={80}
              className="mx-auto h-auto hover:opacity-90 transition-opacity"
              style={{ maxWidth: '245px' }}
            />
          </Link>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center items-center gap-5 mb-8">
          <a
            href="https://www.instagram.com/sanacion_en_luz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300"
            aria-label="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-[#33275f]">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a
            href="https://www.facebook.com/sanacionenluz.2020"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300"
            aria-label="Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-[#33275f]">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a
            href="https://twitter.com/SanacionEnLuz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300"
            aria-label="X (formerly Twitter)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1227" className="w-[18px] h-[18px] fill-[#33275f]">
              <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" />
            </svg>
          </a>
          <a
            href="https://api.whatsapp.com/send/?phone=5491141771120"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300"
            aria-label="WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-[#33275f]">
              <path fillRule="evenodd" clipRule="evenodd" d="M11.42 21.815a10.02 10.02 0 01-5.111-1.39l-.365-.218-3.799.997 1.018-3.705-.24-.38a9.98 9.98 0 01-1.53-5.362c0-5.526 4.498-10.024 10.027-10.024 2.678 0 5.195 1.042 7.086 2.936a10.025 10.025 0 012.93 7.088c0 5.527-4.498 10.024-10.027 10.024v.034h.011zm-5.46-3.208l.196.115a8.297 8.297 0 004.225 1.15c4.58 0 8.307-3.725 8.307-8.308 0-2.222-.865-4.308-2.434-5.882a8.318 8.318 0 00-5.873-2.425c-4.58 0-8.308 3.725-8.308 8.308 0 1.488.398 2.94 1.15 4.226l.128.219-.604 2.203 2.255-.595-.041-.01v-.001z"/>
              <path d="M16.326 13.987c-.272-.136-1.603-.791-1.85-.882-.246-.09-.427-.136-.606.136-.182.273-.7 .882-.857 1.064-.158.181-.314.204-.585.068-.273-.136-1.144-.422-2.18-1.346-.807-.719-1.353-1.607-1.512-1.878-.158-.273-.016-.42.12-.556.121-.122.272-.317.408-.476.136-.159.182-.273.272-.454.09-.182.046-.341-.022-.477-.068-.136-.606-1.464-.83-2.003-.217-.525-.437-.453-.606-.461-.158-.009-.341-.009-.523-.009a1.002 1.002 0 00-.726.34c-.25.273-.953.931-.953 2.27 0 1.338.976 2.632 1.112 2.813.136.182 1.916 2.923 4.64 4.097.648.279 1.153.445 1.547.57.653.208 1.246.179 1.713.109.525-.08 1.603-.654 1.83-1.286.226-.632.226-1.173.158-1.286-.068-.114-.249-.182-.522-.318z"/>
            </svg>
          </a>
          <a
            href="mailto:contacto@sanacionenluz.com"
            className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300"
            aria-label="Email"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-[#33275f]">
              <path d="M2.5 5A2.5 2.5 0 0 0 0 7.5v9A2.5 2.5 0 0 0 2.5 19h19A2.5 2.5 0 0 0 24 16.5v-9A2.5 2.5 0 0 0 21.5 5h-19zm0 2.1l9.5 5.7L21.5 7.1v9.4H2.5V7.1zm19-1.1L12 11.6 2.5 6h19z"/>
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-xs font-medium text-[#33275f]">
            {lang === "en"
              ? "Sanación en Luz® 2026 | All rights reserved."
              : "Sanación en Luz® 2026 | Todos los derechos reservados."}
          </p>
          <Link
            href="/politica-privacidad"
            className="text-xs text-[#33275f]/70 hover:text-[#33275f] font-medium transition-colors"
          >
            {lang === "en" ? "Privacy Policy & Cookies" : "Política de Privacidad y Cookies"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
