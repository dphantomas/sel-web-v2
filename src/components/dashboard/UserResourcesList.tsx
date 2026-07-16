import React from 'react'
import { DownloadCloud, FileText, Headphones, PlayCircle, Folder } from 'lucide-react'

type ResourceCard = {
  id: string
  name: string
  description: string | null
  type: string
  isDownloadable: boolean
  courseInstanceId: string | null
  courseTitle: string
}

export default function UserResourcesList({ resources }: { resources: ResourceCard[] }) {
  if (!resources || resources.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <p className="text-gray-600">Aún no tienes materiales de estudio disponibles.</p>
      </div>
    )
  }

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-[#B681AE]" />
    if (type.includes('audio')) return <Headphones className="w-6 h-6 text-[#9187BA]" />
    if (type.includes('video')) return <PlayCircle className="w-6 h-6 text-[#33275f]" />
    return <Folder className="w-6 h-6 text-gray-400" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (
        // Anchor nativo, no router.push: la navegación de cliente contra los
        // rewrites de next.config.ts es la que rompía con 404 (ver 2b483c9,
        // que cambió a <a> el resto del sitio por el mismo motivo).
        <a
          key={resource.id}
          href={`/visor/${resource.id}`}
          className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 text-left shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-white/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden"
        >
          {resource.courseInstanceId && (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase z-10 shadow-sm">
              Exclusivo Instancia
            </div>
          )}
          <div className="flex items-start gap-4 mb-4 mt-2">
            <div className="p-3 bg-[#B681AE]/10 rounded-xl group-hover:bg-[#B681AE]/20 transition-colors shrink-0">
              {getIcon(resource.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[#33275f] font-bold text-lg leading-tight line-clamp-2 pr-2">
                {resource.name}
              </h3>
              {resource.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-3 leading-snug">
                  {resource.description}
                </p>
              )}
              <p className="text-xs font-bold text-[#B681AE] mt-3 tracking-wide uppercase truncate pr-2">
                {resource.courseTitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto w-full">
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
              {resource.type.split('/')[1]?.toUpperCase() || 'ARCHIVO'}
            </span>
            <div className="flex items-center text-[#9187BA] text-sm font-bold group-hover:text-[#33275f] transition-colors">
              <span className="mr-2">{resource.isDownloadable ? 'Descargar' : 'Ver'}</span>
              {resource.isDownloadable ? (
                <DownloadCloud className="w-4 h-4" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
