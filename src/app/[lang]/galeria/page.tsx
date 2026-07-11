import Gallery from '@/components/gallery/Gallery'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Galería | Sanación en Luz',
  description: 'Galería de fotos de encuentros, talleres y retiros de Sanación en Luz.',
}

export default async function GaleriaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const images = await prisma.galleryImage.findMany({
    orderBy: { createdAt: 'desc' },
  })
  
  return <Gallery lang={lang} initialImages={images} />
}
