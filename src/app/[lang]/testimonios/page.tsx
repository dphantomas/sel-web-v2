import Testimonials from '@/components/testimonios/Testimonials'

export const metadata = {
  title: 'Testimonios | Sanación en Luz',
  description: 'Testimonios de personas que han transitado el proceso de Sanación en Luz.',
}

export default async function TestimoniosPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Testimonials lang={lang} />
}
