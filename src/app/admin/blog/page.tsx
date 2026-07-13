import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Globe, Calendar, CheckCircle2, XCircle, Languages, Edit } from "lucide-react";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  // Agrupar posts por translationGroupId (o por id si no tienen grupo)
  const groupedPosts = posts.reduce((acc, post) => {
    const groupId = post.translationGroupId || post.id;
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-sel-purple">Artículos del Blog</h2>
          <p className="text-sm text-sel-body">Gestioná los artículos y sus traducciones.</p>
        </div>
        <Link 
          href="/admin/blog/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-sel-purple hover:bg-sel-quote-icon text-white font-bold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Artículo
        </Link>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sel-lavender/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sel-cream border-b border-sel-lavender/20">
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider">Artículo</th>
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider">Versiones</th>
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sel-lavender/20">
              {Object.keys(groupedPosts).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sel-body">
                    No hay artículos creados aún.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedPosts).map(([groupId, group]) => {
                  const mainPost = group.find(p => p.language === 'es') || group[0];
                  const hasEs = group.some(p => p.language === 'es');
                  const hasEn = group.some(p => p.language === 'en');

                  return (
                    <tr key={groupId} className="hover:bg-sel-cream/60 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sel-purple">{mainPost.title}</p>
                        <p className="text-sm text-sel-body truncate max-w-md">{mainPost.excerpt}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {[...group].sort((a, b) => a.language === 'es' ? -1 : b.language === 'es' ? 1 : 0).map(p => (
                            <Link 
                              key={p.id} 
                              href={`/admin/blog/${p.id}`} 
                              title="Editar esta versión"
                              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sel-lavender/30 hover:border-sel-purple hover:bg-sel-lavender/10 transition-colors bg-white shadow-sm"
                            >
                              <span className="text-xs font-bold text-sel-purple uppercase">{p.language}</span>
                              {p.published ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-amber-500" />
                              )}
                              <Edit className="w-3.5 h-3.5 text-sel-lavender group-hover:text-sel-purple ml-1" />
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-sel-body">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-sel-lavender" />
                          {format(new Date(mainPost.createdAt), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(!hasEs || !hasEn) && (
                          <Link
                            href={`/admin/blog/new?groupId=${groupId}&targetLang=${!hasEs ? 'es' : 'en'}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-sel-author bg-sel-lavender/10 hover:bg-sel-lavender/20 rounded-lg transition-colors"
                          >
                            <Languages className="w-4 h-4" />
                            Traducir a {!hasEs ? 'ES' : 'EN'}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
