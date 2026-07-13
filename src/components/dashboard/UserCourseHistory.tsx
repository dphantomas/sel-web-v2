'use client'

import React from 'react'

export default function UserCourseHistory({ instances }: { instances: any[] }) {
  if (!instances || instances.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <p className="text-gray-600">Aún no tenés historial de participación en encuentros.</p>
      </div>
    )
  }

  const sortedInstances = [...instances].sort((a, b) => {
    const dateA = new Date(a.courseInstance.startDate).getTime()
    const dateB = new Date(b.courseInstance.startDate).getTime()
    return dateB - dateA // más recientes primero
  })

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-[#33275f] text-sm tracking-wide">
              <th className="p-4 font-bold border-b border-gray-100 whitespace-nowrap">Fecha del Encuentro</th>
              <th className="p-4 font-bold border-b border-gray-100 min-w-[200px]">Taller / Curso</th>
              <th className="p-4 font-bold border-b border-gray-100">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {sortedInstances.map((access) => {
              const instance = access.courseInstance
              const dateStr = new Date(instance.startDate).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC'
              })

              return (
                <tr key={access.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="p-4 text-gray-700 font-medium whitespace-nowrap">
                    {dateStr}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-[#33275f]">{instance.course?.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{instance.course?.type}</p>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {instance.location || 'Presencial / Offline'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
