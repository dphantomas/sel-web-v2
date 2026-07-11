"use client";

import { useState } from "react";
import { markLessonAsCompleted } from "@/modules/courses/actions";
import { useRouter } from "next/navigation";

export function CompleteButton({ lessonId, isCompleted, nextLessonSlug, courseSlug, lang }: { lessonId: string, isCompleted: boolean, nextLessonSlug?: string, courseSlug: string, lang: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    if (isCompleted) {
      if (nextLessonSlug) {
        router.push(`/${lang}/cursos/${courseSlug}/${nextLessonSlug}`);
      }
      return;
    }

    setLoading(true);
    const result = await markLessonAsCompleted(lessonId);
    setLoading(false);

    if (result.success && nextLessonSlug) {
      router.push(`/${lang}/cursos/${courseSlug}/${nextLessonSlug}`);
    }
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className={`px-6 py-3 font-semibold rounded-lg transition-all ${
        isCompleted
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200"
          : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      }`}
    >
      {loading ? "Guardando..." : isCompleted ? (nextLessonSlug ? "Siguiente Clase ➔" : "Completada ✓") : "Marcar como Completada"}
    </button>
  );
}
