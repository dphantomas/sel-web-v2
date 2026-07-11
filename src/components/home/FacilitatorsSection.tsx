"use client";

import Image from "next/image";
import Link from "next/link";

interface FacilitatorsSectionProps {
  dict: any;
  lang: string;
}

export function FacilitatorsSection({ dict, lang }: FacilitatorsSectionProps) {
  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);

  return (
    <section className="py-16 bg-[#fcfbfe]">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
        <div className="w-full md:w-1/2 relative">
          <div className="absolute -inset-4 bg-[#e8daf5] rounded-tl-[80px] rounded-br-[80px] opacity-50 transform -rotate-3"></div>
          <img 
            src="/assets/darioymonica.jpg"
            alt="Darío y Mónica" 
            className="relative rounded-tl-[60px] rounded-br-[60px] shadow-2xl w-full object-cover"
            style={{ maxHeight: '400px', objectPosition: 'center top' }}
          />
        </div>
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl text-[#33275f] font-bold mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
            {dict.facilitatorsTitle}
          </h2>
          <div className="w-12 h-1 bg-[#c2a2e8] mx-auto md:mx-0 mb-6"></div>
          <p className="text-[#666] text-base leading-relaxed mb-8" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {dict.facilitatorsText}
          </p>
          <Link
            href={getLocalizedUrl("/quienes-somos")}
            className="inline-block border-2 border-[#33275f] text-[#33275f] hover:bg-[#33275f] hover:text-white px-6 py-2 rounded-full font-bold transition-all duration-300"
          >
            {dict.facilitatorsBtn}
          </Link>
        </div>
      </div>
    </section>
  );
}
