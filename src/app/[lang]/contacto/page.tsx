import Contact from '@/components/Contact'

export const metadata = {
  title: 'Contacto | Sanación en Luz',
  description: 'Ponete en contacto con Sanación en Luz — WhatsApp, email, Instagram, Facebook.',
}

export default async function ContactoPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Contact lang={lang} />
}
