import AboutUs from '@/components/AboutUs'

export const metadata = {
  title: 'Quiénes Somos | Sanación en Luz',
  description: 'Darío Gabriel Geier y Mónica Nidia García — Complementos Divinos, guías de Sanación en Luz.',
}

export default async function QuienesSomosPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <AboutUs lang={lang} />
}
