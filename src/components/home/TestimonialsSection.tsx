"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TestimonialsSectionProps {
  dict: any;
  lang: string;
}

export function TestimonialsSection({ dict, lang }: TestimonialsSectionProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const handlePrevTestimonial = () => {
    setActiveTestimonial((prev) => (prev === 0 ? dict.testimonialsItems.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) => (prev === dict.testimonialsItems.length - 1 ? 0 : prev + 1));
  };

  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);
  const isEn = lang === 'en';

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 text-center relative">
        <h2 className="text-2xl md:text-3xl text-[#33275f] font-bold mb-10" style={{ fontFamily: "'Lato', sans-serif" }}>
          {dict.testimonialsTitle}
        </h2>
        
        <div className="relative bg-[#fcfbfe] p-6 md:p-10 rounded-3xl shadow-sm border border-[#e3e1e8] mb-8 min-h-[220px] flex flex-col justify-center">
          <div className="text-5xl text-[#e8daf5] absolute top-4 left-6 md:left-8 font-serif">"</div>
          <p className="text-[#555] text-base md:text-lg italic relative z-10 mb-6 mt-4" style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.7em' }}>
            {dict.testimonialsItems[activeTestimonial].text}
          </p>
          <p className="text-[#b085b3] font-bold text-base uppercase tracking-wider">
            — {dict.testimonialsItems[activeTestimonial].author}
          </p>
          
          {/* Carousel Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 md:-mx-4 pointer-events-none">
            <button 
              onClick={handlePrevTestimonial}
              aria-label={isEn ? "Previous testimonial" : "Testimonio anterior"}
              className="pointer-events-auto p-2 rounded-full bg-white shadow-md text-[#33275f] hover:bg-[#f9f7fc] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextTestimonial}
              aria-label={isEn ? "Next testimonial" : "Siguiente testimonio"}
              className="pointer-events-auto p-2 rounded-full bg-white shadow-md text-[#33275f] hover:bg-[#f9f7fc] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {dict.testimonialsItems.map((_: any, i: number) => (
            <button
              key={i}
              aria-label={(isEn ? "Go to testimonial " : "Ir al testimonio ") + (i + 1)}
              onClick={() => setActiveTestimonial(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeTestimonial ? '24px' : '8px',
                height: '8px',
                backgroundColor: i === activeTestimonial ? '#33275f' : '#d4aeea',
              }}
            />
          ))}
        </div>

        <Link
          href={getLocalizedUrl("/testimonios")}
          className="text-[#9187BA] font-bold hover:text-[#33275f] transition-colors inline-flex items-center gap-2"
        >
          {dict.testimonialsBtn} <span className="text-lg">→</span>
        </Link>
      </div>
    </section>
  );
}
