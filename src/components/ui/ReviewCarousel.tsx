"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { remark } from "remark";
import html from "remark-html";

export interface Review {
  id: string;
  authorName: string;
  authorRole?: string | null;
  authorImage?: string | null;
  content: string;
  rating?: number | null;
}

interface ReviewCarouselProps {
  reviews: Review[];
  autoPlay?: boolean;
  speed?: number; // Delay in ms, default 5000
}

export function ReviewCarousel({ reviews, autoPlay = true, speed = 5000 }: ReviewCarouselProps) {
  const plugins = React.useMemo(() => {
    return autoPlay ? [Autoplay({ delay: speed, stopOnInteraction: true })] : [];
  }, [autoPlay, speed]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    plugins
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 md:px-12 py-8 group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 md:-ml-6 touch-pan-y">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 pl-4 md:pl-6"
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 shadow-md border border-zinc-100 dark:border-zinc-700 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors z-10 md:opacity-0 group-hover:opacity-100"
        aria-label="Anterior reseña"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 shadow-md border border-zinc-100 dark:border-zinc-700 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors z-10 md:opacity-0 group-hover:opacity-100"
        aria-label="Siguiente reseña"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    const processMarkdown = async () => {
      try {
        const file = await remark().use(html).process(review.content);
        setHtmlContent(String(file));
      } catch (e) {
        setHtmlContent(review.content); // Fallback
      }
    };
    processMarkdown();
  }, [review.content]);

  return (
    <div className="h-full p-6 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden">
      <Quote className="absolute top-6 right-6 w-8 h-8 text-zinc-100 dark:text-zinc-800" />
      
      <div className="flex items-center gap-1 text-amber-500 mb-4 z-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < (review.rating || 5) ? 'fill-current' : 'text-zinc-200 dark:text-zinc-700'}`} />
        ))}
      </div>
      
      <div 
        className="prose prose-sm dark:prose-invert text-zinc-600 dark:text-zinc-400 flex-1 mb-6 z-10"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      
      <div className="flex items-center gap-3 mt-auto z-10">
        {review.authorImage ? (
          <img src={review.authorImage} alt={review.authorName} className="w-12 h-12 rounded-full object-cover bg-zinc-100 border border-zinc-200 dark:border-zinc-700" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 font-bold text-lg">
            {review.authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-zinc-900 dark:text-white leading-tight">{review.authorName}</p>
          {review.authorRole && <p className="text-sm text-zinc-500 mt-0.5">{review.authorRole}</p>}
        </div>
      </div>
    </div>
  );
}
