"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Review {
  id: string;
  authorName: string;
  authorRole?: string | null;
  authorImage?: string | null;
  content: string;
  rating?: number | null;
}

interface HomeTestimonialCarouselProps {
  reviews: Review[];
  isEn: boolean;
}

export function HomeTestimonialCarousel({ reviews, isEn }: HomeTestimonialCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const plugins = React.useMemo(() => {
    return [AutoScroll({ speed: 0.8, stopOnInteraction: false, stopOnMouseEnter: true, startDelay: 200 })];
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    plugins
  );

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.stop();
    emblaApi.scrollPrev();
    const resume = () => {
      if (autoScroll) autoScroll.play();
      emblaApi.off("settle", resume);
    };
    emblaApi.on("settle", resume);
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.stop();
    emblaApi.scrollNext();
    const resume = () => {
      if (autoScroll) autoScroll.play();
      emblaApi.off("settle", resume);
    };
    emblaApi.on("settle", resume);
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.stop();
    emblaApi.scrollTo(index);
    const resume = () => {
      if (autoScroll) autoScroll.play();
      emblaApi.off("settle", resume);
    };
    emblaApi.on("settle", resume);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <>
      <div className="relative bg-[#fcfbfe] p-6 md:p-10 rounded-3xl shadow-sm border border-[#e3e1e8] mb-8 min-h-[220px] flex flex-col justify-center overflow-hidden">
        <div className="text-5xl text-[#e8daf5] absolute top-4 left-6 md:left-8 font-serif">"</div>
        
        <div className="overflow-hidden w-full relative z-10" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="flex-[0_0_100%] min-w-0 px-4 md:px-8"
              >
                <div className="flex flex-col items-center justify-center min-h-[120px]">
                  <p className="text-[#555] text-base md:text-lg italic mb-6 mt-4 text-center w-full" style={{ fontFamily: "'Open Sans', sans-serif", lineHeight: '1.7em' }}>
                    {review.content}
                  </p>
                  <p className="text-[#b085b3] font-bold text-base uppercase tracking-wider text-center w-full">
                    — {review.authorName} {review.authorRole ? `(${review.authorRole})` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 md:-mx-4 pointer-events-none z-20">
          <button 
            onClick={scrollPrev}
            aria-label={isEn ? "Previous testimonial" : "Testimonio anterior"}
            className="pointer-events-auto p-2 rounded-full bg-white shadow-md text-[#33275f] hover:bg-[#f9f7fc] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={scrollNext}
            aria-label={isEn ? "Next testimonial" : "Siguiente testimonio"}
            className="pointer-events-auto p-2 rounded-full bg-white shadow-md text-[#33275f] hover:bg-[#f9f7fc] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-6">
        {reviews.map((_, i) => (
          <button
            key={i}
            aria-label={(isEn ? "Go to testimonial " : "Ir al testimonio ") + (i + 1)}
            onClick={() => scrollTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === selectedIndex ? '24px' : '8px',
              height: '8px',
              backgroundColor: i === selectedIndex ? '#33275f' : '#d4aeea',
            }}
          />
        ))}
      </div>
    </>
  );
}
