'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const founders = [
  {
    id: 'dario',
    name: 'Darío Gabriel Geier',
    role: { es: 'Complemento Divino', en: 'Divine Complement' },
    photo: '/assets/Dario.png',
    photoClass: 'object-cover',
    photoStyle: { objectPosition: 'center' },
    summary: {
      es: 'Nacido en Buenos Aires, Argentina. Técnico electrónico, músico clásico, programador informático y orfebre. Entre 1984 y 2009 vivió en el exterior transitando diferentes senderos espirituales. En 2010 regresó a Argentina.',
      en: 'Born in Buenos Aires, Argentina. Electronic technician, classical musician, computer programmer and goldsmith. Between 1984 and 2009 he lived abroad on different spiritual paths. In 2010 he returned to Argentina.',
    },
    fullBio: {
      es: [
        'Nací en Buenos Aires, Argentina. Mi vida tuvo diferentes matices, siendo técnico electrónico, músico clásico, programador informático y orfebre. Entre los años 1984 y 2009 viví en el exterior donde conocí y transité diferentes senderos espirituales y de crecimiento personal.',
        'En el año 2010 mi vida tuvo un giro y volví a la Argentina con la excusa de traer una nueva técnica de sanación que todavía no se conocía en esta área. Era necesario estar en este espacio para concretar lo que realmente vine a hacer.',
        'Así fue como conocí a Mónica, con quien compartimos el transmitir diferentes formas de sanaciones y métodos de crecimiento personal. Estando juntos en sesión, se presentó Yeshua, mostrándome nuestros corazones unidos por un canal de Luz. En ese momento se nos explicó que éramos Complementos Divinos y que nuestro camino juntos comenzaba.',
        'El proceso continuó durante 2017 con la información que creó en ese momento el taller de Quietud, el que ahora forma parte inseparable de Sanación en Luz.',
      ],
      en: [
        'I was born in Buenos Aires, Argentina. My life had different nuances, being an electronic technician, classical musician, computer programmer and goldsmith. Between 1984 and 2009 I lived abroad where I knew and walked different spiritual and personal growth paths.',
        'In 2010 my life took a turn and I returned to Argentina with the excuse of bringing a new healing technique that was not yet known in this area. It was necessary to be in this space to realize what I really came to do.',
        "That's how I met Monica, with whom we shared transmitting different forms of healing and methods of personal growth. While in session together, Yeshua appeared, showing me our hearts united by a channel of Light. At that time, it was explained to us that we were Divine Complements and that our journey together began.",
        'The process continued throughout 2017 with the information that created at that time the Quietude workshop, which is now an inseparable part of Sanación en Luz.',
      ],
    },
  },
  {
    id: 'monica',
    name: 'Mónica Nidia García',
    role: { es: 'Complemento Divino', en: 'Divine Complement' },
    photo: '/assets/Monica.png',
    photoClass: 'object-cover',
    photoStyle: { objectPosition: 'center' },
    summary: {
      es: 'Nacida en Comodoro Rivadavia, Patagonia Argentina. Aproximadamente 28 años de trayectoria en sanación y crecimiento personal. Terapeuta holística que integra la danza como comunicación no verbal.',
      en: 'Born in Comodoro Rivadavia, Patagonia Argentina. Approximately 28 years of experience in healing and personal growth. Holistic therapist who integrates dance as non-verbal communication.',
    },
    fullBio: {
      es: [
        'Nací en una ciudad ubicada al pie del cerro Chenque y a orillas del mar, Comodoro Rivadavia en la mágica Patagonia Argentina.',
        'Hace 28 años aproximadamente inicié mi camino de sanación y crecimiento personal a través de diferentes técnicas de sanación, pero también transitando un proceso de autoconocimiento personal que me llevó a expresarme por medio de la danza para comunicar y transmitir de una forma no verbal.',
        'Desde muy pequeña tengo una relación estrecha y personal con mis ángeles, siempre acompañándome en todos los aspectos de mi vida. Con su presencia y guía continua ayudaban a sostener la pureza del canal, transmi tiéndome mensajes e información específica para el momento.',
        'En el año 2016 inició una nueva etapa en mi vida personal y espiritual, en la que más tarde junto con Darío comenzamos a recibir y decodificar la frecuencia de Sanación en Luz.',
      ],
      en: [
        'I was born in a city located at the foot of Mount Chenque and on the seashore — Comodoro Rivadavia in magical Patagonia, Argentina.',
        'Approximately 28 years ago I began my path of healing and personal growth through different healing techniques, while simultaneously going through a process of personal self-knowledge that led me to express myself through dance to communicate in a non-verbal way.',
        'Since I was very young I have had a close and personal relationship with my angels, always accompanying me in all aspects of my life. With their presence and continuous guidance they helped to sustain the purity of the channel, transmitting messages and specific information for the moment.',
        'In 2016 a new stage began in my personal and spiritual life, in which later together with Darío we began to receive and decode the frequency of Sanación en Luz.',
      ],
    },
  },
]


export default function AboutUs({ lang = 'es' }: { lang?: string }) {
  const [activeBio, setActiveBio] = useState<any>(null)

  // Global rule: ESC to close modals
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeBio) setActiveBio(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeBio])

  return (
    <section
      id="quienes-somos"
      className="relative"
      style={{ backgroundColor: '#fff' }}
    >
      {/* Section header with cabezal2 background */}
      <div
        className="section-header-bg flex flex-col items-center justify-center"
        style={{ minHeight: '160px', paddingTop: '60px', paddingBottom: '20px' }}
      >
        <h2 
          className="text-white text-[28px] md:text-[34px] tracking-[5px] md:tracking-[10px] font-light text-center pl-[5px] md:pl-[10px]"
          
        >
          {lang === 'en' ? 'About Us' : 'Quiénes Somos'}
        </h2>
      </div>

      {/* Main content area with parallax background */}
      <div 
        className="relative pt-8 pb-16 md:pt-10 md:pb-24 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/10"></div> 

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 md:px-6">
          {/* Arrow ornament */}
          <div className="text-center mb-16">
            <img
              src="/assets/flecha2.png"
              alt=""
              style={{ width: '60px', height: 'auto', margin: '0 auto' }}
            />
          </div>

        {/* Joint photo */}
        <div
          className="mb-12 overflow-hidden"
          style={{
            boxShadow: '6px 6px 18px 0px rgba(0,0,0,0.3)',
            maxWidth: '548px',
            margin: '0 auto 48px',
          }}
        >
          <img
            src="/assets/darioymonica.jpg"
            alt="Darío y Mónica"
            className="w-full h-auto"
          />
        </div>

        {/* Intro text */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p
            style={{
              fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
              fontStyle: 'italic',
              fontSize: '30px',
              lineHeight: '1.3em',
              color: '#33275f',
              marginBottom: '15px',
            }}
          >
            Darío y Mónica
          </p>
          <p
            style={{
              fontFamily: "'Open Sans', sans-serif",
              fontStyle: 'italic',
              fontSize: '17px',
              color: '#666',
              lineHeight: '1.5em',
            }}
          >
            {lang === 'en'
              ? 'We united as Divine Complements and, with the Council of Twelve as our guides, we transmit in these times the path of Sanación en Luz.'
              : 'Nos unimos como Complementos Divinos y, teniendo al Consejo de los Doce como nuestros guías, transmitimos en estos tiempos el camino de Sanación en Luz.'}
          </p>
        </div>

        {/* Bio cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {founders.map((founder) => (
            <div
              key={founder.id}
              className="bg-white p-8"
              style={{ boxShadow: '0px 4px 16px rgba(0,0,0,0.1)' }}
            >
              {/* Thumbnail */}
              <div className="mb-4 overflow-hidden" style={{ width: '80px', height: '80px', boxShadow: '3px 3px 10px rgba(0,0,0,0.2)' }}>
                <img
                  src={founder.photo}
                  alt={founder.name}
                  className={`w-full h-full ${founder.photoClass}`}
                  style={founder.photoStyle}
                />
              </div>

              <h3
                style={{
                  fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
                  fontSize: '20px',
                  color: '#33275f',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                {founder.name}
              </h3>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: '#b085b3',
                  marginBottom: '12px',
                }}
              >
                {typeof founder.role === 'object' ? founder.role[lang as 'es' | 'en'] : founder.role}
              </p>
              <p
                style={{
                  fontFamily: "'Open Sans', sans-serif",
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.6em',
                  marginBottom: '16px',
                }}
              >
                {typeof founder.summary === 'object' ? founder.summary[lang as 'es' | 'en'] : founder.summary}
              </p>
              <button
                onClick={() => setActiveBio(founder)}
                className="cursor-pointer hover:underline"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#33275f',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {lang === 'en' ? 'Read full story →' : 'Leer historia completa →'}
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Bio Modal */}
      {activeBio && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActiveBio(null)}
        >
          <div
            className="bg-white w-full max-w-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: '#e3e1e8' }}
            >
              <div>
                <h4 style={{ fontFamily: "'Lato', sans-serif", fontSize: '20px', color: '#33275f', fontWeight: 700 }}>
                  {activeBio.name}
                </h4>
                <span style={{ fontFamily: "'Lato', sans-serif", fontStyle: 'italic', fontSize: '13px', color: '#b085b3' }}>
                  {activeBio.role?.[lang as 'es' | 'en'] ?? activeBio.role}
                </span>
              </div>
              <button
                onClick={() => setActiveBio(null)}
                className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" style={{ color: '#33275f' }} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-grow">
              {(activeBio.fullBio?.[lang as 'es' | 'en'] ?? activeBio.fullBio ?? []).map((paragraph: string, i: number) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '15px',
                    color: '#555',
                    lineHeight: '1.7em',
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Modal footer */}
            <div className="p-6 border-t flex justify-end" style={{ borderColor: '#e3e1e8' }}>
              <button
                onClick={() => setActiveBio(null)}
                className="px-6 py-2 cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: '#33275f',
                  color: '#fff',
                  fontFamily: "'Lato', sans-serif",
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                {lang === 'en' ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
