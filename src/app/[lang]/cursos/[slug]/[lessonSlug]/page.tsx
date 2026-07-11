import { getCourseBySlug } from "@/modules/courses/services";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { prisma } from "@/lib/prisma";
import { CompleteButton } from "./CompleteButton";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import markdownToHtml from "@/lib/markdown";
import { getPresignedDownloadUrl } from "@/modules/media/s3";

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: { params: Promise<{ slug: string, lessonSlug: string, lang: string }> }) {
  const { slug, lessonSlug, lang } = await params;
  const course = await getCourseBySlug(slug, lang);

  if (!course) {
    notFound();
  }

  // Security check
  const session = await getServerSession(authOptions);
  let hasAccess = false;
  let user = null;
  if (session?.user?.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { unlockedCourses: true, progress: true }
    });
    if (user?.role === 'Admin' || user?.unlockedCourses.some(uc => uc.courseId === course.id)) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="text-center bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">Necesitas adquirir este curso para ver las clases.</p>
          <Link href={`/${lang}/cursos/${slug}`} className="text-blue-600 hover:underline font-medium">Volver al curso</Link>
        </div>
      </div>
    );
  }

  // Encontrar la lección actual y la siguiente en el índice
  let nextLessonSlug = undefined;
  
  const allLessons = course.modules.flatMap(m => m.lessons);
  const currentIndex = allLessons.findIndex(l => l.slug === lessonSlug);
  
  if (currentIndex !== -1 && currentIndex + 1 < allLessons.length) {
    nextLessonSlug = allLessons[currentIndex + 1].slug;
  }

  // Traer la lección completa desde la DB
  const currentLesson = await prisma.lesson.findUnique({
    where: { slug: lessonSlug }
  });

  if (!currentLesson) {
    notFound();
  }

  // Verificar progreso
  const isCompleted = user?.progress.some(p => p.lessonId === currentLesson.id && p.completed) || false;

  // Procesar video
  let finalVideoUrl = currentLesson.videoUrl;
  if (finalVideoUrl && !finalVideoUrl.startsWith('http')) {
    // Si no es un enlace absoluto, asumimos que es una key de R2
    try {
      finalVideoUrl = await getPresignedDownloadUrl(finalVideoUrl, 7200); // 2 horas
    } catch (e) {
      console.error("Error generando URL firmada", e);
      finalVideoUrl = null;
    }
  }

  // Procesar markdown
  const htmlContent = currentLesson.content ? await markdownToHtml(currentLesson.content) : null;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950">
      
      {/* Sidebar Temario (Desktop) */}
      <div className="w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex-shrink-0 h-[calc(100vh-4rem)] overflow-y-auto hidden md:block">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href={`/${lang}/cursos/${course.slug}`} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium flex items-center gap-2 mb-2">
            ← Volver al inicio
          </Link>
          <h2 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-2">{course.title}</h2>
        </div>
        
        <div className="py-4">
          {course.modules.map((module) => (
            <div key={module.id} className="mb-6">
              <h3 className="px-6 text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2">
                {module.title}
              </h3>
              <ul className="flex flex-col">
                {module.lessons.map((lesson, idx) => {
                  const isActive = lesson.slug === lessonSlug;
                  const isLessonCompleted = user?.progress.some(p => p.lessonId === lesson.id && p.completed) || false;
                  
                  return (
                    <li key={lesson.id}>
                      <Link 
                        href={`/${lang}/cursos/${course.slug}/${lesson.slug}`}
                        className={`flex items-start gap-3 px-6 py-2.5 text-sm transition-colors ${
                          isActive 
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold border-r-2 border-blue-600" 
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                          isLessonCompleted 
                            ? "border-emerald-500 bg-emerald-500 text-white" 
                            : isActive ? "border-blue-500" : "border-zinc-300 dark:border-zinc-700"
                        }`}>
                          {isLessonCompleted ? "✓" : ""}
                        </span>
                        <span className="line-clamp-2">{lesson.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Mobile Back Button */}
          <Link href={`/${lang}/cursos/${course.slug}`} className="md:hidden text-sm text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-2 mb-6">
            ← Temario
          </Link>

          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">
              {currentLesson.title}
            </h1>
          </div>

          {/* Video Player */}
          {finalVideoUrl && (
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-8 relative shadow-lg">
              <VideoPlayer url={finalVideoUrl} />
            </div>
          )}

          {/* Controls & Content */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
            <CompleteButton 
              lessonId={currentLesson.id} 
              isCompleted={isCompleted} 
              nextLessonSlug={nextLessonSlug}
              courseSlug={course.slug}
              lang={lang}
            />
          </div>

          <div className="prose prose-zinc dark:prose-invert max-w-none pb-20">
            {htmlContent ? (
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : (
              <p className="text-zinc-500 italic">No hay contenido de texto adicional.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
