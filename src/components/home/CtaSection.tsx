"use client";

import { MessageCircle, Mail } from "lucide-react";

interface CtaSectionProps {
  dict: any;
  lang: string;
}

export function CtaSection({ dict, lang }: CtaSectionProps) {
  return (
    <section className="py-16 bg-[#33275f] text-center">
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl text-white font-light mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
          {dict.ctaTitle}
        </h2>
        <p className="text-[#e8daf5] text-lg mb-8" style={{ fontFamily: "'Open Sans', sans-serif" }}>
          {dict.ctaText}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="https://api.whatsapp.com/send/?phone=5491141771120"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25d366] hover:bg-[#1da851] text-white px-6 py-2 rounded-full font-bold transition-colors flex items-center justify-center gap-2"
          >
            {dict.ctaBtn1}
          </a>
          <a
            href="mailto:contacto@sanacionenluz.com"
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#33275f] px-6 py-2 rounded-full font-bold transition-colors flex items-center justify-center gap-2"
          >
            {dict.ctaBtn2}
          </a>
        </div>
      </div>
    </section>
  );
}
