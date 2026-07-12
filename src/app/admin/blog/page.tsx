import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Globe, Calendar, CheckCircle2, XCircle, Languages } from "lucide-react";
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

  return (
    <div>
      <div className="flex items-center justify-end mb-8">
        <Link 
          href="/admin/blog/new"
          className="flex items-center gap-2 px-4 py-2 bg-sel-purple hover:bg-sel-quote-icon text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Artículo
        </Link>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden blog-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sel-cream border-b border-sel-lavender/20">
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider">Artículo</th>
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider">Idioma</th>
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-semibold text-sel-body uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sel-lavender/20">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sel-body">
                    No hay artículos creados aún.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-sel-cream/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sel-purple">{post.title}</p>
                      <p className="text-sm text-sel-body truncate max-w-md">{post.excerpt}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Globe className="w-4 h-4 text-sel-lavender" />
                        <span className="uppercase text-sel-body">{post.language}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.published ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <XCircle className="w-3.5 h-3.5" />
                          Borrador
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-sel-body">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-sel-lavender" />
                        {format(new Date(post.createdAt), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blog/new?groupId=${post.translationGroupId || ''}&targetLang=${post.language === 'es' ? 'en' : 'es'}`}
                          title="Crear Traducción"
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-sel-author bg-sel-lavender/10 hover:bg-sel-lavender/20 rounded-lg transition-colors"
                        >
                          <Languages className="w-4 h-4" />
                          Traducir
                        </Link>
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-sel-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
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
