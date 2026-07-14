import React from 'react'
import { getReviews } from '@/app/actions/review-actions'
import DOMPurify from 'isomorphic-dompurify'
import Link from 'next/link'

export default async function Testimonials({ lang = 'es' }: { lang?: string }) {
  const reviews = await getReviews(true);

  return (
    <section id="testimonios" className="bg-[#fcfbfe]">
      <div
        className="section-header-bg flex flex-col items-center justify-center"
        style={{ minHeight: '160px', paddingTop: '60px', paddingBottom: '20px' }}
      >
        <h2 className="text-white text-[28px] md:text-[34px] tracking-[5px] md:tracking-[10px] font-light text-center pl-[5px] md:pl-[10px]" >
          {lang === 'en' ? 'Testimonials' : 'Testimonios'}
        </h2>
      </div>

      <div 
        className="relative pt-8 pb-16 md:pt-10 md:pb-24 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/10"></div> 

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 flex flex-col items-center gap-6">
            <img
              src="/assets/flecha2.png"
              alt=""
              style={{ width: '60px', height: 'auto', margin: '0 auto' }}
            />
            <p className="text-gray-600 max-w-xl text-lg mx-auto">
              {lang === 'en' ? 'Would you like to share your experience with us?' : '¿Te gustaría compartir tu experiencia con nosotros?'}
            </p>
            <Link 
              href={`/${lang}/escribir-resena`}
              className="inline-flex items-center justify-center px-8 py-3 bg-[#9187ba] text-white rounded-xl font-bold shadow-md hover:bg-[#b085b3] transition-colors"
            >
              {lang === 'en' ? 'Write a review' : 'Compartir mi experiencia'}
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((t, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative border border-[#e3e1e8] flex flex-col"
              >
                <div
                  className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#f9f7fc' }}
                  aria-hidden="true"
                >
                  <span style={{ color: '#9187ba', fontSize: '22px', fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</span>
                </div>

                <div
                  className="text-[#666] prose prose-sm max-w-none flex-grow mt-6 mb-6"
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    lineHeight: '1.7em',
                    padding: '0 10px',
                  }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t.content) }}
                />

                <p
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: '#b085b3',
                    textAlign: 'right',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                >
                  — {t.authorName} {t.authorRole ? `(${t.authorRole})` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
