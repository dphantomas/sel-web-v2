'use client'

import dynamic from 'next/dynamic'

/**
 * Envoltorio que carga el visor de PDF SOLO en el cliente.
 *
 * pdf.js usa APIs del navegador (`DOMMatrix`) apenas se evalúa el módulo. Los
 * Client Components igual se prerenderizan en el server por default, así que
 * importar la implementación derecho tiraba `ReferenceError: DOMMatrix is not
 * defined` y la página del visor respondía 500 — no se veía porque
 * ENABLE_S3_STORAGE estaba apagado y el visor rebotaba antes de llegar a
 * renderizar el PDF.
 *
 * `ssr: false` sólo funciona dentro de un Client Component (ver
 * node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md), y la página del
 * visor es un Server Component — por eso este archivo existe: es la frontera de
 * cliente donde `ssr: false` es válido.
 */
const SecurePDFViewerImpl = dynamic(() => import('./SecurePDFViewerImpl'), {
  ssr: false,
  loading: () => (
    <p className="text-center text-gray-500 animate-pulse py-10">Cargando documento...</p>
  ),
})

export function SecurePDFViewer({ url }: { url: string }) {
  return <SecurePDFViewerImpl url={url} />
}
