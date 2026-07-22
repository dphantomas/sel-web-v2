"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { submitUserReview } from "@/app/actions/review-actions";
import { useRouter } from "next/navigation";

export default function ReviewFormClient({ authorName, lang }: { authorName: string, lang: string }) {
  const [name, setName] = useState(authorName);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content === "<p></p>" || !name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await submitUserReview({
        authorName: name,
        content,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${lang}/mis-cursos`);
      }, 5000);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      alert("Hubo un error al enviar la reseña. Intenta nuevamente.");
    }
  }

  if (success) {
    return (
      <div className="bg-[#fcfbfe] rounded-2xl p-8 text-center border border-[#e3e1e8] shadow-sm">
        <h3 className="text-2xl font-bold text-[#b085b3] mb-4">¡Gracias por tu testimonio!</h3>
        <p className="text-gray-600 mb-6">Hemos recibido tu reseña correctamente. Pronto la podrás ver publicada.</p>
        <p className="text-sm text-gray-500">Redirigiendo a tus cursos...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#e3e1e8]">
      <div className="mb-6">
        <label className="block text-sm font-bold text-sel-purple mb-2">Tu Nombre (como aparecerá publicado)</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="w-full px-4 py-2 rounded-xl border focus:border-[#9187BA] focus:ring-1 focus:ring-[#9187BA] outline-none"
          required
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-bold text-sel-purple mb-2">Tu Testimonio</label>
        <RichTextEditor 
          value={content} 
          onChange={setContent} 
          placeholder="Cuéntanos cómo fue tu experiencia..." 
        />
      </div>
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim() || content === "<p></p>"}
          className="px-6 py-2 bg-sel-purple text-white rounded-lg font-bold shadow-md hover:bg-[#5b21b6] transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Enviando..." : "Enviar Reseña"}
        </button>
      </div>
    </form>
  );
}
