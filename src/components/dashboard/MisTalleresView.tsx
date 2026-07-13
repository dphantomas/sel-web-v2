'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, List, BookOpen } from 'lucide-react'
import UserCourseHistory from './UserCourseHistory'

export default function MisTalleresView({ instances, lang }: { instances: any[], lang: string }) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const getLocalizedUrl = (path: string) => {
    if (lang === 'es') return path;
    return `/${lang}${path}`;
  };

  // Group instances by course for the grid view
  const coursesMap = new Map();
  instances.forEach(access => {
    const instance = access.courseInstance;
    const courseId = instance.course.id;
    if (!coursesMap.has(courseId)) {
      coursesMap.set(courseId, {
        course: instance.course,
        instances: []
      });
    }
    coursesMap.get(courseId).instances.push(instance);
  });
  const coursesList = Array.from(coursesMap.values());

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-md rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40">
        <h2 className="text-[#33275f] text-lg md:text-xl font-bold tracking-wide m-0">HISTORIAL DE ENCUENTROS</h2>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#33275f]' : 'text-gray-400 hover:text-gray-600'}`}
            title="Vista de lista"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#33275f]' : 'text-gray-400 hover:text-gray-600'}`}
            title="Vista de mosaico"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <UserCourseHistory instances={instances} />
      ) : (
        <>
          {coursesList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {coursesList.map(({ course, instances }) => (
                <div key={course.id} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_10px_40px_rgba(51,39,95,0.06)] border border-white overflow-hidden flex flex-col group transition-all hover:shadow-[0_15px_50px_rgba(51,39,95,0.12)] hover:-translate-y-1">
                  {/* Portada */}
                  <div className="aspect-video bg-gradient-to-tr from-[#33275f] to-[#b085b3] flex items-center justify-center relative overflow-hidden">
                    {course.image ? (
                      <img
                        src={course.image}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-500" />
                    )}
                  </div>

                  <div className="p-8 flex-1 flex flex-col bg-white/50">
                    <div className="flex-1">
                      <span className="text-xs font-bold tracking-wider text-[#b085b3] mb-3 block">
                        {course.type}
                      </span>
                      <h3 className="text-xl font-bold text-[#33275f] mb-3 line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {course.title}
                      </h3>
                      <p className="text-sm text-[#666] line-clamp-2 mb-6 leading-relaxed">
                        {course.shortDescription}
                      </p>
                      
                      {/* Instancias realizadas */}
                      {instances.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-[#33275f] uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Instancias realizadas:</h4>
                          <ul className="space-y-1.5">
                            {instances.map((inst: any) => (
                              <li key={inst.id} className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#d4aeea] rounded-full"></span>
                                {new Date(inst.startDate).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                                {inst.location && <span className="text-gray-400 text-xs">({inst.location})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Acción */}
                    <Link
                      href={getLocalizedUrl(`/cursos/${course.slug}`)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-[#33275f] text-white text-sm font-bold rounded-xl hover:bg-[#4a398c] transition-colors shadow-md mt-auto"
                    >
                      <BookOpen className="w-4 h-4" />
                      Ver Información
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40">
              <p className="text-gray-600">Aún no tenés historial de participación en encuentros.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
