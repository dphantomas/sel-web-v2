import React from 'react'
import CoursesGrid from '@/components/cursos/CoursesGrid'

interface WorkshopsProps {
  initialCourses: any[]
  lang?: string
}

export default function Workshops({ initialCourses, lang = 'es' }: WorkshopsProps) {
  const isEn = lang === 'en';

  const t = {
    title: isEn ? 'Workshops' : 'Talleres',
  };

  return (
    <section id="talleres" className="w-full">
      <div
        className="section-header-bg flex flex-col items-center justify-center"
        style={{ minHeight: '160px', paddingTop: '60px', paddingBottom: '20px' }}
      >
        <h2 className="text-white text-[28px] md:text-[34px] tracking-[5px] md:tracking-[10px] font-light text-center pl-[5px] md:pl-[10px]" >
          {t.title}
        </h2>
      </div>

      <div 
        className="relative pt-8 pb-16 md:pt-10 md:pb-24 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/10"></div> 

        <div className="relative w-full">
          {/* Arrow ornament */}
          <div className="text-center mb-16 relative z-10">
            <img
              src="/assets/flecha2.png"
              alt=""
              style={{ width: '60px', height: 'auto', margin: '0 auto' }}
            />
          </div>

          <div className="w-full relative z-10">
            <CoursesGrid initialCourses={initialCourses || []} lang={lang} hideHero={true} />
          </div>
        </div>
      </div>
    </section>
  )
}
