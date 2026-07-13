import Link from "next/link";
import { HomeTestimonialCarousel } from "@/components/home/HomeTestimonialCarousel";
import { getReviews } from "@/app/actions/review-actions";

interface TestimonialsSectionProps {
  dict: any;
  lang: string;
}

export async function TestimonialsSection({ dict, lang }: TestimonialsSectionProps) {
  const getLocalizedUrl = (path: string) => (lang === "es" ? path : `/${lang}${path}`);
  const isEn = lang === 'en';
  const reviews = await getReviews(true);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-3xl mx-auto px-6 text-center relative">
        <h2 className="text-2xl md:text-3xl text-[#33275f] font-bold mb-10" style={{ fontFamily: "'Lato', sans-serif" }}>
          {dict.testimonialsTitle}
        </h2>
        
        <HomeTestimonialCarousel reviews={reviews} isEn={isEn} />

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
