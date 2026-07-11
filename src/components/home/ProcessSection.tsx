"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProcessSectionProps {
  dict: any;
  lang: string;
}

export function ProcessSection({ dict, lang }: ProcessSectionProps) {
  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);

  return (
    <section
      id="process-section"
      className="relative py-16 parallax-bg"
      style={{
        backgroundImage: `url(/assets/fondo-blog-1.jpg)`,
      }}
    >
      <div className="absolute inset-0 bg-white/80" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="mb-8">
          <img src="/assets/flecha2.png" alt="" className="mx-auto w-[60px]" />
        </div>

        <div className="space-y-6 text-[#33275f] text-[20px] md:text-[24px] font-light leading-relaxed mb-10" style={{ fontFamily: "'Lato', sans-serif" }}>
          <p className="drop-shadow-sm" dangerouslySetInnerHTML={{ __html: dict.processLine1 }} />
          <p className="drop-shadow-sm" dangerouslySetInnerHTML={{ __html: dict.processLine2 }} />
          <p className="drop-shadow-sm" dangerouslySetInnerHTML={{ __html: dict.processLine3 }} />
        </div>

        <Link
          href={getLocalizedUrl("/talleres")}
          className="inline-block bg-[#9187BA] hover:bg-[#33275f] text-white px-8 py-3 rounded-full font-bold tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          {dict.processBtn}
        </Link>
      </div>
      
      {/* Decorative shadow at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 sombra-bg z-20 pointer-events-none transform rotate-180"></div>
    </section>
  );
}
