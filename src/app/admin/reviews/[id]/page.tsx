import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { createReview, updateReview } from "@/app/actions/review-actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReviewContentEditor } from "@/components/admin/ReviewContentEditor";

export default async function ReviewEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const review = isNew ? null : await prisma.review.findUnique({ where: { id } });

  if (!isNew && !review) return notFound();

  async function handleSave(formData: FormData) {
    "use server";
    const data = {
      authorName: formData.get("authorName") as string,
      content: formData.get("content") as string,
      isActive: formData.get("isActive") === "on",
    };

    if (isNew) {
      await createReview(data);
    } else {
      await updateReview(id, data);
    }
    redirect("/admin/reviews");
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/reviews" className="p-2 bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-full hover:bg-sel-lavender/10 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-sel-purple dark:text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-sel-purple dark:text-white mb-1">
            {isNew ? "Nueva Reseña" : "Editar Reseña"}
          </h1>
          <p className="text-sel-body/70 dark:text-zinc-400">
            {isNew ? "Añade un nuevo testimonio a la plataforma." : "Modifica los detalles de la reseña seleccionada."}
          </p>
        </div>
      </div>

      <form action={handleSave} className="space-y-6 bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-bold text-sel-purple dark:text-white">Nombre del Autor *</label>
          <input
            name="authorName"
            defaultValue={review?.authorName || ""}
            required
            className="w-full px-4 py-2 bg-[#fcfbfe] dark:bg-zinc-800 border border-sel-lavender/30 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sel-purple text-sel-body dark:text-zinc-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-sel-purple dark:text-white">Contenido (Admite Markdown/HTML) *</label>
          <ReviewContentEditor initialContent={review?.content || ""} />
        </div>

        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            name="isActive"
            id="isActive"
            defaultChecked={review ? review.isActive : true}
            className="w-4 h-4 text-sel-purple rounded border-sel-lavender/30 dark:border-zinc-700 focus:ring-sel-purple"
          />
          <label htmlFor="isActive" className="text-sm font-bold text-sel-purple dark:text-white">
            Reseña Visible (Activa)
          </label>
        </div>

        <div className="pt-4 border-t border-sel-lavender/30 dark:border-zinc-800 flex justify-end gap-3">
          <Link href="/admin/reviews" className="px-5 py-2.5 text-sm font-bold text-sel-body dark:text-zinc-400 hover:bg-sel-lavender/10 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-sel-purple hover:bg-[#2a1f52] text-white rounded-lg transition-colors">
            Guardar Reseña
          </button>
        </div>
      </form>
    </div>
  );
}
