import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Globe, CheckCircle2, XCircle, Languages, GraduationCap, Clock } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { id: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            Gestión de Cursos
          </h1>
          <p className="text-zinc-500">Administra los metadatos y publicaciones de los cursos.</p>
        </div>
        <Link 
          href="/admin/cursos/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Curso
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Curso</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Idioma</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo/Mod.</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No hay cursos creados aún.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-zinc-400" />
                        {course.title}
                      </p>
                      <p className="text-sm text-zinc-500 truncate max-w-md">{course.shortDescription || "Sin descripción corta"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Globe className="w-4 h-4 text-zinc-400" />
                        <span className="uppercase text-zinc-600 dark:text-zinc-300">{course.language}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      <div>{course.type}</div>
                      <div className="text-xs text-zinc-500">{course.modality} • {course.synchronicity}</div>
                    </td>
                    <td className="px-6 py-4">
                      {course.published ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Borrador
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/cursos/new?groupId=${course.translationGroupId || ''}&targetLang=${course.language === 'es' ? 'en' : 'es'}`}
                          title="Crear Traducción"
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                        >
                          <Languages className="w-4 h-4" />
                          Traducir
                        </Link>
                        <Link
                          href={`/admin/cursos/${course.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
