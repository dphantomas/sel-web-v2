import { getServerSession } from 'next-auth'
import { authOptions } from '@/modules/auth/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/modules/media/s3'
import { SecureVideo, SecureAudio } from '@/components/ui/SecureMedia'
import { SecurePDFViewer } from '@/components/ui/SecurePDFViewer'

export const metadata = {
  title: 'Visor de Materiales | Sanación en Luz',
}

export default async function VisorPage({ params }: { params: Promise<{ id: string, lang: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const resource = await prisma.resource.findUnique({ where: { id } })
  if (!resource) {
    redirect('/dashboard/recursos')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      unlockedCourses: true,
      unlockedInstances: true
    }
  })

  // Validar acceso del usuario al recurso
  const hasCourseAccess = resource.courseId 
    ? user?.unlockedCourses.some(uc => uc.courseId === resource.courseId) 
    : false
    
  const hasInstanceAccess = resource.courseInstanceId 
    ? user?.unlockedInstances.some(ui => ui.courseInstanceId === resource.courseInstanceId) 
    : false
  
  if (!hasCourseAccess && !hasInstanceAccess) {
    redirect('/dashboard/recursos')
  }

  const resourceType = (resource.type || '').toLowerCase()
  const isPdf = resourceType.includes('pdf')
  const isAudio = resourceType.includes('audio') || resourceType.includes('mp3') || resourceType.includes('m4a')
  const isVideo = resourceType.includes('video') || resourceType.includes('mp4')

  let url = ''
  try {
    // Si es un archivo que se va a mostrar en el navegador (pdf, audio, video) forzamos inline=true
    // para que Cloudflare R2 no obligue al navegador a descargarlo
    const shouldViewInline = isPdf || isAudio || isVideo || !resource.isDownloadable
    url = await getPresignedDownloadUrl(resource.cloudflareKey, 3600, shouldViewInline)
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    redirect('/dashboard/recursos')
  }

  return (
    <div className="min-h-screen bg-[#f8f6fc] flex flex-col font-sans">
      <header className="bg-white px-4 md:px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-lg md:text-xl font-bold text-[#33275f] truncate pr-4" style={{ fontFamily: "'Lato', sans-serif" }}>
          {resource.name}
        </h1>
        <a 
          href="/dashboard/recursos" 
          className="px-4 py-2 bg-[#B681AE] text-white rounded-lg font-bold text-sm hover:bg-[#9187BA] transition-colors shrink-0 shadow-sm"
        >
          Cerrar Visor
        </a>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 flex flex-col justify-center items-center">
        {isPdf && (
          <div className="w-full">
            <SecurePDFViewer url={url} />
          </div>
        )}
        
        {isVideo && (
          <div className="w-full bg-black rounded-xl shadow-lg overflow-hidden border border-gray-800">
            <SecureVideo src={url} />
          </div>
        )}
        
        {isAudio && (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md mx-auto flex flex-col items-center gap-8">
            <div className="w-32 h-32 bg-[#B681AE]/10 rounded-full flex items-center justify-center text-[#B681AE] shadow-inner">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <div className="w-full text-center mb-2">
              <h2 className="text-[#33275f] font-bold text-lg">{resource.name}</h2>
              <p className="text-gray-500 text-sm mt-1">Audio</p>
            </div>
            <SecureAudio src={url} />
          </div>
        )}
        
        {!isPdf && !isVideo && !isAudio && (
          <div className="bg-white p-10 rounded-2xl shadow-lg text-center max-w-md w-full border border-gray-100">
            <svg className="w-16 h-16 mx-auto text-[#B681AE] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            <h2 className="text-xl font-bold text-[#33275f] mb-3">{resource.name}</h2>
            {resource.isDownloadable ? (
              <>
                <p className="text-gray-600 mb-8">Este archivo no se puede previsualizar en el navegador, pero está habilitado para descarga.</p>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-[#33275f] text-white rounded-xl font-bold inline-block hover:bg-[#B681AE] transition-colors shadow-md"
                >
                  Descargar Archivo
                </a>
              </>
            ) : (
              <>
                <p className="text-red-500 mb-8 font-medium">Este archivo no es compatible con el visor seguro y su descarga está deshabilitada.</p>
                <a 
                  href="/dashboard/recursos"
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold inline-block hover:bg-gray-300 transition-colors shadow-md"
                >
                  Volver
                </a>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
