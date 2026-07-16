'use client'

import React, { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Worker servido desde nuestro propio dominio, no desde unpkg. Traerlo de un
// CDN externo hacía que el visor dependiera de un tercero para funcionar, le
// mostraba a unpkg cada apertura de PDF, y moría con cualquier CSP estricta —
// todo en la feature cuyo objetivo es proteger contenido.
// El archivo lo copia `npm run copy:pdf-worker` desde pdfjs-dist en cada
// postinstall, así no puede quedar desincronizado de la versión que usa react-pdf
// (un mismatch de versión hace fallar a pdf.js).
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export default function SecurePDFViewerImpl({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [width, setWidth] = useState(800)

  useEffect(() => {
    // Prevenir menú contextual en todo el documento
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    
    // Resize handler
    const handleResize = () => setWidth(Math.min(window.innerWidth * 0.9, 800))
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  if (!url) return <p className="text-center text-gray-500 animate-pulse py-10">Cargando documento...</p>

  return (
    <div className="flex flex-col items-center bg-gray-50 p-4 md:p-8 rounded-2xl border border-gray-200 w-full max-w-4xl mx-auto select-none">
      
      {/* Renderizador de PDF */}
      <div 
        className="w-full flex justify-center bg-white shadow-lg overflow-x-auto min-h-[600px] relative pointer-events-none"
        style={{ pointerEvents: 'none' }}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex h-full items-center justify-center p-20"><p className="text-gray-500 animate-pulse">Procesando PDF...</p></div>}
          error={<p className="text-red-500 p-10">Error al cargar el documento PDF.</p>}
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            width={width}
          />
        </Document>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 w-full mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100" style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber(p => p - 1)}
          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <p className="text-sm text-gray-600 font-medium select-none">
          {pageNumber} / {numPages || '-'}
        </p>
        <button
          type="button"
          disabled={numPages ? pageNumber >= numPages : true}
          onClick={() => setPageNumber(p => p + 1)}
          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

    </div>
  )
}
