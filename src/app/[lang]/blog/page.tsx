import { getPublishedPosts } from "@/modules/blog/services";
import { getDictionary, Locale } from "@/i18n/dictionaries";
import Link from "next/link";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.blog.title + ' | Sanación en Luz',
    description: dict.blog.subtitle,
  };
}

export default async function BlogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  let posts: any[] = [];
  try {
    posts = await getPublishedPosts(lang);
  } catch (e) {
    console.error('Failed to fetch posts:', e);
  }

  const dateLocale = lang === 'es' ? es : enUS;

  return (
    <section className="bg-white">
      {/* Section header */}
      <div
        className="section-header-bg flex flex-col items-center justify-center"
        style={{ minHeight: '160px', paddingTop: '60px', paddingBottom: '20px', backgroundColor: '#33275f' }}
      >
        <h1 className="text-white text-[28px] md:text-[34px] tracking-[5px] md:tracking-[10px] font-light text-center pl-[5px] md:pl-[10px]">
          Blog
        </h1>
      </div>

      {/* Main content area with parallax background */}
      <div 
        className="relative pt-8 pb-16 md:pt-10 md:pb-24 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/assets/fondo-quienes.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/10"></div> 

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6">
          {/* Arrow ornament */}
          <div className="text-center mb-16">
            <img
              src="/assets/flecha2.png"
              alt=""
              style={{ width: '60px', height: 'auto', margin: '0 auto' }}
            />
          </div>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const imageUrl = post.coverImage;
              return (
                <Link
                  key={post.slug}
                  href={`/${lang}/blog/${post.slug}/`}
                  className="blog-card block bg-white overflow-hidden"
                  style={{ textDecoration: 'none' }}
                >
                  {imageUrl && (
                    <div className="relative overflow-hidden" style={{ height: '250px' }}>
                      <img
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="blog-card-overlay absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold" style={{ fontFamily: "'Lato', sans-serif" }}>
                          {lang === 'en' ? 'read more' : 'leer más'}
                        </span>
                      </div>
                    </div>
                  )}
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
                      dangerouslySetInnerHTML={{ __html: post.title }}
                    />
                    <p style={{ color: '#c2a2e8', fontSize: '14px', fontFamily: "'Open Sans', sans-serif", marginBottom: '8px' }}>
                      {format(new Date(post.createdAt), 'MMMM d, yyyy', { locale: dateLocale })}
                    </p>
                    {post.excerpt ? (
                      <div
                        style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6em' }}
                        dangerouslySetInnerHTML={{ __html: post.excerpt }}
                      />
                    ) : (
                      <p style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '14px', color: '#666', lineHeight: '1.6em' }}>
                        {lang === 'en' ? 'Read full article here...' : 'Lee el artículo completo aquí...'}
                      </p>
                    )}
                    <span style={{ display: 'inline-block', marginTop: '12px', color: '#2ea3f2', fontSize: '14px', fontWeight: 700 }}>
                      {lang === 'en' ? 'read more' : 'leer más'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p style={{ color: '#666', fontFamily: "'Open Sans', sans-serif" }}>
              Cargando artículos...
            </p>
          </div>
        )}
        </div>
      </div>
    </section>
  )
}
