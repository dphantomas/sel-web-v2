'use client'

import React from 'react'
import { CalendarDays, MapPin, Tag } from 'lucide-react'

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
              <th className="p-5 font-bold border-b border-gray-100 whitespace-nowrap">Fecha del Encuentro</th>
              <th className="p-5 font-bold border-b border-gray-100 min-w-[200px]">Taller / Curso</th>
              <th className="p-5 font-bold border-b border-gray-100">Ubicación</th>
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
                <tr key={access.id} className="border-b border-gray-50 hover:bg-[#f8f6fc] transition-colors group">
                  <td className="p-5 text-gray-700 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#B681AE]" />
                      <span>{dateStr}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-[#33275f] text-base group-hover:text-[#B681AE] transition-colors">
                      {instance.course?.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-500 font-medium">{instance.course?.type}</p>
                    </div>
                  </td>
                  <td className="p-5 text-gray-600 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{instance.location || 'Presencial / Offline'}</span>
                    </div>
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
