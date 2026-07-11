import { getPublishedCourses } from "@/modules/courses/services";

export const metadata = {
  title: "Cursos Disponibles | DGG Master Template",
};

export const dynamic = 'force-dynamic';

import Link from "next/link";

export default async function CoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const courses = await getPublishedCourses(lang);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">
          Catálogo de Cursos
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          Módulo LMS demostrativo del DGG Master Template.
        </p>

        {courses.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-zinc-500">No hay cursos publicados por el momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Link 
                href={`/${lang}/cursos/${course.slug}`}
                key={course.id} 
                className="group border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-zinc-50 dark:bg-zinc-900/50 block cursor-pointer"
              >
                <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden">
                  {course.image ? (
                    <img 
                      src={course.image} 
                      alt={course.title} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-full">
                      {course.type}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {course.modules.length} {course.modules.length === 1 ? 'módulo' : 'módulos'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-2">
                    {course.shortDescription || course.description || "Sin descripción disponible."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
