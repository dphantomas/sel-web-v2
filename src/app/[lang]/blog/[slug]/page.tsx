import { getPostBySlug, getPublishedPosts } from "@/modules/blog/services";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { renderEditorHtml } from "@/lib/html";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string, lang: string }> }) {
  const { slug, lang } = await params;
  const post = await getPostBySlug(slug, lang);
  if (!post) return { title: 'Artículo no encontrado | Sanación en Luz' };
  
  return {
    title: `${post.title} | Sanación en Luz`,
    description: post.excerpt || '',
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string, lang: string }> }) {
  const { slug, lang } = await params;
  const post = await getPostBySlug(slug, lang);

  if (!post) {
    const originalPost = await prisma.post.findUnique({
      where: { slug }
    });
    
    if (originalPost) {
      if (originalPost.translationGroupId) {
        const translatedPost = await prisma.post.findFirst({
          where: { 
            translationGroupId: originalPost.translationGroupId, 
            language: lang,
            published: true
          }
        });
        
        if (translatedPost) {
          const urlBase = lang === 'es' ? '' : `/${lang}`;
          redirect(`${urlBase}/blog/${translatedPost.slug}`);
        }
      }
      const urlBase = lang === 'es' ? '' : `/${lang}`;
      redirect(`${urlBase}/blog`);
    }
    notFound();
  }

  const dateLocale = lang === 'es' ? es : enUS;
  const backHref = lang === 'en' ? '/en/blog/' : '/blog/';
  const backLabel = lang === 'en' ? '← Back to Blog' : '← Volver al Blog';

  // Fetch sibling posts in same language for prev/next
  const sameLang = await getPublishedPosts(lang);
  const idx = sameLang.findIndex((p) => p.slug === slug);
  const prevPost = idx < sameLang.length - 1 ? sameLang[idx + 1] : null;
  const nextPost = idx > 0 ? sameLang[idx - 1] : null;

  const imageUrl = post.coverImage;

  // El blog guarda HTML (editor WYSIWYG). El allowlist vive centralizado en
  // src/lib/html.ts para que no se desincronice del editor — ver regla 19.
  const contentHtml = renderEditorHtml(post.content);

  return (
    <article className="bg-white">
      {/* Header with featured image */}
      <div
        className="relative flex items-end justify-center"
        style={{
          minHeight: '300px',
          paddingBottom: '40px',
          paddingTop: '100px',
          backgroundImage: imageUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(51,39,95,0.7)), url(${imageUrl})`
            : 'linear-gradient(to bottom, #33275f, #5a4a8a)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center px-6 max-w-3xl">
          <h1
            style={{
              fontFamily: "'Lato', Helvetica, Arial, Lucida, sans-serif",
              fontSize: '32px',
              color: '#ffffff',
              margin: 0,
              fontWeight: 700,
              lineHeight: '1.3em',
            }}
          >
            {post.title}
          </h1>
          <p style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '12px' }}>
            {format(new Date(post.createdAt), 'MMMM d, yyyy', { locale: dateLocale })}
          </p>
        </div>
      </div>

      {/* Arrow ornament */}
      <div className="text-center mt-8 mb-8">
        <img src="/assets/flecha.png" alt=""
          style={{ width: '50px', height: 'auto', margin: '0 auto' }} />
      </div>

      {/* Post content */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-8">
        <div
          className="wp-content prose prose-sm sm:prose-base dark:prose-invert max-w-none"
          style={{ fontFamily: "'Open Sans', Arial, sans-serif", fontSize: '15px', color: '#666', lineHeight: '1.7em' }}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </div>

      {/* Prev / Next navigation */}
      <div
        className="max-w-3xl mx-auto px-4 md:px-6 pb-16"
        style={{ borderTop: '1px solid #e3e1e8', paddingTop: '32px' }}
      >
        <div className="flex justify-between items-start gap-4">
          {/* Previous (older) */}
          {prevPost ? (
            <Link
              href={`/${lang}/blog/${prevPost.slug}/`}
              style={{ textDecoration: 'none', maxWidth: '45%' }}
            >
              <p style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '11px', color: '#c2a2e8', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                ← {lang === 'en' ? 'Previous' : 'Anterior'}
              </p>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '14px', color: '#33275f', fontWeight: 600, lineHeight: '1.4em' }}>
                {prevPost.title}
              </p>
            </Link>
          ) : <span />}

          {/* Next (newer) */}
          {nextPost ? (
            <Link
              href={`/${lang}/blog/${nextPost.slug}/`}
              style={{ textDecoration: 'none', maxWidth: '45%', textAlign: 'right' }}
            >
              <p style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '11px', color: '#c2a2e8', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Next' : 'Siguiente'} →
              </p>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '14px', color: '#33275f', fontWeight: 600, lineHeight: '1.4em' }}>
                {nextPost.title}
              </p>
            </Link>
          ) : <span />}
        </div>

        {/* Back to blog */}
        <div className="mt-8 text-center">
          <Link
            href={backHref}
            style={{ fontFamily: "'Lato', sans-serif", fontSize: '14px', fontWeight: 700, color: '#33275f', textDecoration: 'none' }}
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </article>
  )
}
