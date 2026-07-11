'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function CoursesGrid({ initialCourses, lang = 'es', hideHero = false }: { initialCourses: any[], lang?: string, hideHero?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeModal = () => setSelectedCourse(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    if (selectedCourse) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCourse])

  return (
    <div className={hideHero ? "w-full flex flex-col" : "min-h-screen bg-gray-50 flex flex-col"}>
      {!hideHero && (
        <>
          {/* Spacer for navbar */}
          <div className={`transition-all duration-300 ${isScrolled ? 'h-16 lg:h-20' : 'h-24 lg:h-32'}`} />

          {/* Hero Section with Parallax */}
          <section className="relative overflow-hidden w-full aspect-[2/1] sm:aspect-[3/1] lg:aspect-[4/1] flex flex-col justify-center items-center py-16">
            <div className="absolute inset-0 z-0">
              <Image
                src="/assets/taller8.jpg"
                alt="Fondo Talleres"
                fill
                className="object-cover scale-110 -translate-y-8 md:-translate-y-16"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-purple-800/40 mix-blend-multiply" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 text-center text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 tracking-wide drop-shadow-md">
                Catálogo Dinámico
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-xl font-light opacity-90 leading-relaxed drop-shadow">
                Explora nuestros cursos y talleres, cargados automáticamente desde la base de datos.
              </p>
            </div>
          </section>
        </>
      )}

      {/* Grid Content */}
      <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow ${hideHero ? '' : 'py-16 md:py-24'}`}>
        {initialCourses.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <h2 className="text-2xl font-light">No hay cursos publicados por el momento.</h2>
            <p className="mt-4">Vuelve a visitar esta página pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {initialCourses.map((course) => (
              <div 
                key={course.id}
                onClick={() => {
                  if (course.description) setSelectedCourse(course)
                }}
                className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 border border-purple-100 flex flex-col h-full group ${
                  course.description ? 'hover:shadow-xl cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Image Container */}
                <div className="relative w-full aspect-video overflow-hidden">
                  <Image 
                    src={course.image || '/assets/default-course.jpg'}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Tags */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {course.type && (
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-purple-900 shadow-sm">
                        {course.type}
                      </span>
                    )}
                    {course.modality && (
                      <span className="bg-purple-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm">
                        {course.modality}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-medium text-gray-900 mb-3 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  {(course.shortDescription || course.description) && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                      {course.shortDescription || course.description}
                    </p>
                  )}

                  {/* Footer/Action */}
                  <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
                    <button
                      disabled={!course.description}
                      className={`font-medium text-sm transition-colors flex items-center gap-2 ${
                        course.description 
                          ? 'text-purple-600 group-hover:text-purple-800 cursor-pointer' 
                          : 'text-gray-400 cursor-not-allowed opacity-60 pointer-events-none'
                      }`}
                    >
                      {lang === 'en' ? 'More Info' : 'Más Info'}
                      <span className="text-lg">→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal / Popup */}
      {selectedCourse && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 pt-16 md:pt-24 bg-black/60 backdrop-blur-sm animate-modal-overlay" 
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-modal-content"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Modal Header with Image */}
            <div className="relative w-full flex-shrink-0 bg-purple-900 overflow-hidden" style={{ height: '240px', minHeight: '240px', display: 'block' }}>
              <Image 
                src={selectedCourse.image || '/assets/default-course.jpg'} 
                alt={selectedCourse.title} 
                fill 
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
              
              

              {/* Title & Tags over image */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                <div className="flex gap-2 mb-3">
                  {selectedCourse.type && (
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/30 shadow-sm">
                      {selectedCourse.type}
                    </span>
                  )}
                  {selectedCourse.modality && (
                    <span className="bg-purple-500/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-purple-400/50 shadow-sm">
                      {selectedCourse.modality}
                    </span>
                  )}
                </div>
                <h2 
                  className="text-xl md:text-2xl font-semibold text-white tracking-wide"
                  style={{ textShadow: '0px 2px 10px rgba(0,0,0,0.9), 0px 4px 20px rgba(0,0,0,0.8)' }}
                >
                  {selectedCourse.title}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-grow">
              <div className="prose prose-lg prose-purple max-w-none">
                {selectedCourse.description.split('\n').map((paragraph: string, i: number) => {
                  const p = paragraph.trim();
                  if (!p) return null;
                  return (
                    <p key={i} className="text-gray-600 font-light text-[17px] leading-relaxed tracking-wide mb-5">
                      {p}
                    </p>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0 rounded-b-3xl">
              <button 
                onClick={closeModal} 
                className="px-8 py-2.5 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(to right, #6b4c9a, #33275f)' }}
              >
                Volver al catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
