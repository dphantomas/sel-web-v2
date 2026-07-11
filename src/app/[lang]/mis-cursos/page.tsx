import { getServerSession } from "next-auth";
import { authOptions } from "@/modules/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, PlayCircle, Trophy } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    const urlBase = lang === 'es' ? '' : `/${lang}`;
    redirect(`${urlBase}/login?callbackUrl=${urlBase}/mis-cursos`);
  }

  // Obtener el usuario, sus cursos desbloqueados y su progreso
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      unlockedCourses: {
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: true
                }
              }
            }
          }
        }
      },
      progress: true
    }
  });

  if (!user) {
    redirect(`/${lang}/login`);
  }

  const getLocalizedUrl = (path: string) => {
    if (lang === 'es') return path;
    return `/${lang}${path}`;
  };

  const unlockedCourses = user.unlockedCourses.map(uc => uc.course);

  return (
    <div className="min-h-screen bg-[#fefdff] py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#f8f6fc] to-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header del Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#33275f] tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Mis Cursos
            </h1>
            <p className="text-[#666] text-lg">
              Continuá tu aprendizaje desde donde lo dejaste.
            </p>
          </div>
          <Link 
            href={getLocalizedUrl("/cursos")}
            className="inline-flex items-center justify-center px-6 py-3 border border-[#d4aeea] text-sm font-bold rounded-xl text-[#33275f] hover:bg-[#d4aeea]/10 transition-colors shadow-sm bg-white"
          >
            Explorar más cursos
          </Link>
        </div>

        {/* Grilla de Cursos */}
        {unlockedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {unlockedCourses.map((course) => {
              // Calcular progreso
              let totalLessons = 0;
              const courseLessonIds = new Set<string>();
              
              course.modules.forEach(m => {
                totalLessons += m.lessons.length;
                m.lessons.forEach(l => courseLessonIds.add(l.id));
              });

              const completedLessons = user.progress.filter(p => courseLessonIds.has(p.lessonId) && p.completed).length;
              const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
              
              const isCompleted = progressPercentage === 100;

              // Determinar a qué lección ir (la primera por defecto)
              const firstLesson = course.modules[0]?.lessons[0];

              return (
                <div key={course.id} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_10px_40px_rgba(51,39,95,0.06)] border border-white overflow-hidden flex flex-col group transition-all hover:shadow-[0_15px_50px_rgba(51,39,95,0.12)] hover:-translate-y-1">
                  {/* Portada */}
                  <div className="aspect-video bg-gradient-to-tr from-[#33275f] to-[#b085b3] flex items-center justify-center relative overflow-hidden">
                    {course.image ? (
                      <img
                        src={course.image}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-500" />
                    )}
                    {isCompleted && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider flex items-center gap-1 shadow-md">
                        <Trophy className="w-3 h-3" />
                        Completado
                      </div>
                    )}
                  </div>

                  <div className="p-8 flex-1 flex flex-col bg-white/50">
                    <div className="flex-1">
                      <span className="text-xs font-bold tracking-wider text-[#b085b3] mb-3 block">
                        {course.type}
                      </span>
                      <h3 className="text-xl font-bold text-[#33275f] mb-3 line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {course.title}
                      </h3>
                      <p className="text-sm text-[#666] line-clamp-2 mb-8 leading-relaxed">
                        {course.shortDescription}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8 bg-white/80 p-5 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between text-sm mb-3">
                        <span className="font-semibold text-[#33275f]">Progreso</span>
                        <span className="font-bold text-[#b085b3]">{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-[#f0eff5] rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-[#b085b3] to-[#d4aeea] h-2.5 rounded-full transition-all duration-500 ease-out relative" 
                          style={{ width: `${progressPercentage}%` }}
                        >
                           <div className="absolute inset-0 bg-white/20 w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                        </div>
                      </div>
                      <p className="text-xs text-[#9187ba] mt-3 font-medium">
                        {completedLessons} de {totalLessons} clases completadas
                      </p>
                    </div>

                    {/* Acción */}
                    <Link
                      href={firstLesson ? getLocalizedUrl(`/cursos/${course.slug}/${firstLesson.slug}`) : getLocalizedUrl(`/cursos/${course.slug}`)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-[#33275f] text-white text-sm font-bold rounded-xl hover:bg-[#4a398c] transition-colors shadow-md"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {progressPercentage > 0 ? (isCompleted ? 'Repasar Curso' : 'Continuar Curso') : 'Empezar Curso'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/60 backdrop-blur-xl shadow-[0_10px_40px_rgba(51,39,95,0.05)] border border-white rounded-3xl">
            <div className="w-24 h-24 bg-white border border-[#d4aeea]/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <BookOpen className="w-10 h-10 text-[#b085b3]" />
            </div>
            <h2 className="text-2xl font-bold text-[#33275f] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Aún no tenés cursos</h2>
            <p className="text-[#666] mb-8 max-w-md mx-auto leading-relaxed">
              Explorá nuestro catálogo y descubrí formaciones que te ayudarán a llevar tu conocimiento al siguiente nivel.
            </p>
            <Link 
              href={getLocalizedUrl("/cursos")}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#b085b3] to-[#33275f] text-white text-base font-bold rounded-xl hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgba(51,39,95,0.2)]"
            >
              Explorar Catálogo
            </Link>
          </div>
        )}
        
      </div>
    </div>
  );
}
