import { getCourseBySlug } from "@/modules/courses/services";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string, lang: string }> }) {
  const { slug, lang } = await params;
  const course = await getCourseBySlug(slug, lang);

  if (!course) {
    // SMART REDIRECTION
    const originalCourse = await prisma.course.findUnique({
      where: { slug }
    });
    
    if (originalCourse) {
      if (originalCourse.translationGroupId) {
        const translatedCourse = await prisma.course.findFirst({
          where: { 
            translationGroupId: originalCourse.translationGroupId, 
            language: lang,
            published: true
          }
        });
        
        if (translatedCourse) {
          const urlBase = lang === 'es' ? '' : `/${lang}`;
          redirect(`${urlBase}/cursos/${translatedCourse.slug}`);
        }
      }
      
      const urlBase = lang === 'es' ? '' : `/${lang}`;
      redirect(`${urlBase}/cursos`);
    }

    notFound();
  }

  const session = await getServerSession(authOptions);
  let hasAccess = false;

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { unlockedCourses: true }
    });
    if (user?.role === 'Admin' || user?.unlockedCourses.some(uc => uc.courseId === course.id)) {
      hasAccess = true;
    }
  }

  // Encontrar la primera lección para el botón "Comenzar"
  const firstModule = course.modules[0];
  const firstLesson = firstModule?.lessons[0];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pb-20">
      {/* Hero Section */}
      <div className="w-full bg-zinc-900 text-white pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-zinc-800 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 text-zinc-300">
            {course.type}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            {course.title}
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            {course.shortDescription}
          </p>

          {hasAccess ? (
            firstLesson ? (
              <Link 
                href={`/${lang}/cursos/${course.slug}/${firstLesson.slug}`}
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-zinc-900 bg-white rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Continuar Aprendiendo
              </Link>
            ) : (
              <span className="inline-block px-8 py-4 bg-zinc-800 rounded-xl text-zinc-500 font-medium">
                Curso sin contenido aún
              </span>
            )
          ) : (
            <Link 
              href={`/${lang}/login`}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión para Acceder
            </Link>
          )}
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-4xl mx-auto px-4 mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
            Acerca de este curso
          </h2>
          <div className="prose prose-zinc dark:prose-invert max-w-none mb-12">
            <p>{course.description}</p>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
            Temario
          </h2>
          <div className="space-y-6">
            {course.modules.map((module) => (
              <div key={module.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/30">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80">
                  <h3 className="font-bold text-zinc-900 dark:text-white">
                    {module.title}
                  </h3>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {module.lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-400 font-mono text-sm">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {lesson.title}
                        </span>
                      </div>
                      {hasAccess && (
                        <Link 
                          href={`/${lang}/cursos/${course.slug}/${lesson.slug}`}
                          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Ver Clase
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="md:col-span-1">
          <div className="sticky top-24 p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
            <h3 className="font-bold text-lg mb-4 text-zinc-900 dark:text-white">
              Detalles
            </h3>
            <ul className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>Modalidad</span>
                <span className="font-medium text-zinc-900 dark:text-white">{course.modality}</span>
              </li>
              <li className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>Tipo</span>
                <span className="font-medium text-zinc-900 dark:text-white">{course.type}</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>Módulos</span>
                <span className="font-medium text-zinc-900 dark:text-white">{course.modules.length}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
