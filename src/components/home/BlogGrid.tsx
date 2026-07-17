"use client";

import Link from "next/link";
import Image from "next/image";
import { cldFocalFill } from "@/lib/cloudinary-url";

const BASE = "/assets";

// Blog posts with EXACT excerpts from the original HTML
const blogPostsEs = [
  {
    slug: "creacion-pura",
    title: "Creación Pura",
    date: "10/04/2024",
    image: `${BASE}/sel-foto-19-400x250.jpg`,
    excerpt: "Creación Pura es crear una línea de tiempo que no existe todavía y nunca existió, tampoco en el futuro.",
  },
  {
    slug: "causa-y-efecto",
    title: "Causa y Efecto en la Ascensión",
    date: "02/04/2024",
    image: `${BASE}/sel-foto-4-400x250.jpg`,
    excerpt: "Cuando estamos en el proceso de Ascensión aumentamos nuestra vibración y nuestra consciencia. En algún momento empezamos a ver y comprender la interacción entre «Libre Albedrío» y «Causa y Efecto».",
  },
  {
    slug: "dualidad",
    title: "Dualidad",
    date: "28/11/2023",
    image: `${BASE}/sel-foto-21-400x250.jpg`,
    excerpt: "El proceso a la Ascensión requiere ir más allá de la ilusión, encontrarnos con nuestra Verdad.",
  },
  {
    slug: "como-funciona-sanacion-en-luz",
    title: "¿Cómo funciona Sanación en Luz?",
    date: "31/10/2023",
    image: `${BASE}/sel-foto-2-400x250.jpg`,
    excerpt: "«Se ha iniciado la Sanación en Luz. Este proceso empieza a ser Sanación en Luz.»",
  },
  {
    slug: "que-es-sanacion-en-luz",
    title: "¿Qué es Sanación en Luz?",
    date: "30/10/2023",
    image: `${BASE}/sel-foto-1-400x250.jpg`,
    excerpt: "La Era de la Luz nos trae muchas sorpresas en lo que se refiere a la Evolución y Ascensión del ser humano.",
  },
];

const blogPostsEn = [
  {
    slug: "pure-creation",
    title: "Pure Creation",
    date: "10/04/2024",
    image: `${BASE}/sel-foto-19-400x250.jpg`,
    excerpt: "Pure Creation is creating a timeline that doesn't exist yet and never existed, not even in the future.",
  },
  {
    slug: "cause-and-effect",
    title: "Cause and Effect in Ascension",
    date: "02/04/2024",
    image: `${BASE}/sel-foto-4-400x250.jpg`,
    excerpt: "When we are in the Ascension process we increase our vibration and our consciousness...",
  },
  {
    slug: "duality",
    title: "Duality",
    date: "28/11/2023",
    image: `${BASE}/sel-foto-21-400x250.jpg`,
    excerpt: "The process to Ascension requires going beyond illusion, finding our Truth.",
  },
];

interface BlogGridProps {
  lang: string;
  limit?: number;
  dynamicPosts?: any[];
}

export function BlogGrid({ lang, limit, dynamicPosts }: BlogGridProps) {
  const isEn = lang === "en";
  const hardcodedPosts = isEn ? blogPostsEn : blogPostsEs;
  
  // Usar dinámicos si están disponibles y no están vacíos. Si no, fallback a los viejos fijos.
  const postsToRender = dynamicPosts && dynamicPosts.length > 0 ? dynamicPosts : hardcodedPosts;
  const displayedPosts = limit ? postsToRender.slice(0, limit) : postsToRender;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedPosts.map((post) => {
          // Normalizar formato de fecha dependiendo de si viene de BD o es string fijo
          let dateStr = post.date;
          if (post.createdAt) {
             const d = new Date(post.createdAt);
             dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          }

          return (
            <Link
              key={post.slug}
              href={isEn ? `/en/blog/${post.slug}/` : `/blog/${post.slug}/`}
              className="blog-card block bg-white overflow-hidden"
              style={{ textDecoration: 'none' }}
            >
              {/* Image */}
              <div className="relative overflow-hidden" style={{ height: '250px' }}>
                <img
                  src={cldFocalFill(post.image || post.coverImage, 800, 500, post.coverFocus)}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Hover overlay — matching original rgba(122,111,170,0.56) */}
                <div className="blog-card-overlay absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold" style={{ fontFamily: "'Lato', sans-serif" }}>
                    {isEn ? "read more" : "leer más"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 text-center">
                <h2
                  style={{
                    fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
                    fontSize: '17px',
                    color: '#33275f',
                    fontWeight: 500,
                    marginBottom: '8px',
                    lineHeight: '1.3em',
                  }}
                >
                  {post.title}
                </h2>
                <p
                  style={{
                    color: '#c2a2e8',
                    fontSize: '14px',
                    fontFamily: "'Open Sans', sans-serif",
                    marginBottom: '8px',
                  }}
                >
                  {dateStr}
                </p>
                <div
                  style={{
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: '1.6em',
                  }}
                >
                  {post.excerpt}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '12px',
                    color: '#2ea3f2',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  {isEn ? "read more" : "leer más"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
