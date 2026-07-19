import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { deleteReview } from "@/app/actions/review-actions";

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-sel-purple">
              Gestión de Reseñas
            </h1>
            <span className="text-sm text-sel-purple font-bold bg-sel-cream px-3 py-1.5 rounded-lg border border-sel-lavender/30">
              {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
            </span>
          </div>
          <p className="text-sel-body/70">Administra las reseñas y testimonios de la plataforma.</p>
        </div>
        <Link 
          href="/admin/reviews/new"
          className="flex items-center gap-2 px-4 py-2 bg-sel-purple hover:bg-[#2a1f52] text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Reseña
        </Link>
      </div>

      <div className="bg-white border border-sel-lavender/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sel-lavender/10 border-b border-sel-lavender/30">
                <th className="px-6 py-4 text-xs font-bold text-sel-purple uppercase tracking-wider">Autor</th>
                <th className="px-6 py-4 text-xs font-bold text-sel-purple uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-sel-purple uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-sel-purple uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sel-lavender/30">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sel-body/70">
                    No hay reseñas creadas aún.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-sel-lavender/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sel-body">{review.authorName}</p>
                    </td>
                    <td className="px-6 py-4">
                      {review.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Visible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <XCircle className="w-3.5 h-3.5" />
                          Oculta
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-sel-body/70">
                      {format(new Date(review.createdAt), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/reviews/${review.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-sel-purple bg-sel-lavender/20 hover:bg-sel-lavender/40 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Link>
                        <form action={async () => {
                          "use server";
                          await deleteReview(review.id);
                        }}>
                          <button
                            type="submit"
                            title="Eliminar Reseña"
                            className="inline-flex items-center gap-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
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
