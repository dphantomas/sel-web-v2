"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { renderEditorHtml } from "@/lib/html";

interface HomePhrase {
  textEs: string;
  textEn: string;
}

interface ProcessSectionProps {
  dict: any;
  lang: string;
  phrases: HomePhrase[];
}

const PHRASE_DISPLAY_MS = 3500;
const PHRASE_FADE_MS = 1200;
const PHRASE_BLUR_PX = 6;
const PHRASE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const PHRASE_SHADOW = "drop-shadow(0 1px 1px rgba(0,0,0,0.05))";

// Cada aparición recorre uno de estos movimientos al azar, para que las
// frases no repitan siempre el mismo efecto.
const PHRASE_VARIANTS = [
  "translateY(18px) scale(0.96)",
  "translateY(-18px) scale(0.96)",
  "translateX(-24px) scale(0.96)",
  "translateX(24px) scale(0.96)",
  "scale(0.9)",
];

const randomVariant = () => PHRASE_VARIANTS[Math.floor(Math.random() * PHRASE_VARIANTS.length)];

export function ProcessSection({ dict, lang, phrases }: ProcessSectionProps) {
  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);
  const phraseTexts = phrases.map((p) => (lang === "en" ? p.textEn : p.textEs));

  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  // Valor inicial fijo (no Math.random()): el servidor y el cliente deben
  // renderizar lo mismo en el primer paint o React tira un hydration mismatch.
  // El useEffect de abajo lo randomiza apenas monta, así que esto no se nota.
  const [hiddenTransform, setHiddenTransform] = useState(PHRASE_VARIANTS[0]);

  useEffect(() => {
    if (phraseTexts.length === 0) return;

    setHiddenTransform(randomVariant());
    setVisible(false);
    const showFrame = requestAnimationFrame(() => setVisible(true));
    const fadeOutTimer = setTimeout(() => setVisible(false), PHRASE_DISPLAY_MS);
    const nextTimer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % phraseTexts.length);
    }, PHRASE_DISPLAY_MS + PHRASE_FADE_MS);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(fadeOutTimer);
      clearTimeout(nextTimer);
    };
  }, [index, phraseTexts.length]);

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
          <img src="/assets/flecha2.png" alt="" width={60} height={36} className="mx-auto w-[60px]" />
        </div>

        {phraseTexts.length > 0 && (
          <div className="relative grid text-[#33275f] text-[22px] md:text-[27px] font-light leading-relaxed mb-10 py-2" style={{ fontFamily: "'Lato', sans-serif" }}>
            {phraseTexts.map((phrase, i) => {
              const shown = i === index && visible;
              return (
                <p
                  key={i}
                  aria-hidden={i !== index}
                  className="col-start-1 row-start-1 transition-all"
                  style={{
                    opacity: shown ? 1 : 0,
                    transform: shown ? "translate(0, 0) scale(1)" : hiddenTransform,
                    filter: shown ? `blur(0px) ${PHRASE_SHADOW}` : `blur(${PHRASE_BLUR_PX}px) ${PHRASE_SHADOW}`,
                    transitionDuration: `${PHRASE_FADE_MS}ms`,
                    transitionTimingFunction: PHRASE_EASE,
                    willChange: "opacity, transform, filter",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderEditorHtml(phrase) }}
                />
              );
            })}
          </div>
        )}

        <Link
          href={getLocalizedUrl("/talleres")}
          className="inline-block bg-[#6E678D] hover:bg-[#33275f] text-white px-8 py-3 rounded-full font-bold tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          {dict.processBtn}
        </Link>
      </div>
      
      {/* Decorative shadow at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 sombra-bg z-20 pointer-events-none transform rotate-180"></div>
    </section>
  );
}
