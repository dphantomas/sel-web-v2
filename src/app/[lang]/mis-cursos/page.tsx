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
      unlockedInstances: {
        include: {
          courseInstance: {
            include: {
              course: true
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

  const coursesMap = new Map();

  user.unlockedCourses.forEach(uc => {
    if (!coursesMap.has(uc.course.id)) {
      coursesMap.set(uc.course.id, {
        course: uc.course,
        instances: []
      });
    }
  });

  user.unlockedInstances.forEach(ui => {
    const courseId = ui.courseInstance.course.id;
    if (!coursesMap.has(courseId)) {
      coursesMap.set(courseId, {
        course: ui.courseInstance.course,
        instances: []
      });
    }
    coursesMap.get(courseId).instances.push(ui.courseInstance);
  });

  const coursesList = Array.from(coursesMap.values());

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
        {coursesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {coursesList.map(({ course, instances }) => {
              return (
                <div key={course.id} className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_10px_40px_rgba(51,39,95,0.06)] border border-white overflow-hidden flex flex-col group transition-all hover:shadow-[0_15px_50px_rgba(51,39,95,0.12)] hover:-translate-y-1">
                  {/* Portada */}
                  <div className="aspect-video bg-gradient-to-tr from-[#33275f] to-[#b085b3] flex items-center justify-center relative overflow-hidden">
                    {course.image ? (
                      <img
                        src={course.image}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-500" />
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
                      <p className="text-sm text-[#666] line-clamp-2 mb-6 leading-relaxed">
                        {course.shortDescription}
                      </p>
                      
                      {/* Instancias realizadas */}
                      {instances.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-[#33275f] uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Instancias realizadas:</h4>
                          <ul className="space-y-1.5">
                            {instances.map((inst: any) => (
                              <li key={inst.id} className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#d4aeea] rounded-full"></span>
                                {new Date(inst.startDate).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                                {inst.location && <span className="text-gray-400 text-xs">({inst.location})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Acción */}
                    <Link
                      href={getLocalizedUrl(`/cursos/${course.slug}`)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-[#33275f] text-white text-sm font-bold rounded-xl hover:bg-[#4a398c] transition-colors shadow-md mt-auto"
                    >
                      <BookOpen className="w-4 h-4" />
                      Ver Información
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
