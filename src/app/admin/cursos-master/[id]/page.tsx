"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { createCourse, updateCourse, deleteCourse } from "@/modules/courses/actions";
import { CourseType, Modality, Synchronicity } from "@prisma/client";
import { CurriculumBuilder } from "./components/CurriculumBuilder";

function CourseEditorContent({ id, isNew }: { id: string, isNew: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdFromUrl = searchParams.get('groupId');
  const targetLangFromUrl = searchParams.get('targetLang');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'curriculum'>('info');
  const [modules, setModules] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    language: targetLangFromUrl || "es",
    shortDescription: "",
    description: "",
    type: "Type1" as CourseType,
    durationDays: 0,
    modality: "Virtual" as Modality,
    synchronicity: "Asincronico" as Synchronicity,
    coverImage: "",
    published: false,
    translationGroupId: groupIdFromUrl || "",
  });

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    fetch(`/api/admin/courses/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('No encontrado');
        return res.json();
      })
      .then((data) => {
        setFormData({
          title: data.title,
          slug: data.slug,
          language: data.language || "es",
          shortDescription: data.shortDescription || "",
          description: data.description || "",
          type: data.type,
          durationDays: data.durationDays || 0,
          modality: data.modality,
          synchronicity: data.synchronicity,
          coverImage: data.image || "",
          published: data.published,
          translationGroupId: data.translationGroupId || "",
        });
        if (data.modules) {
          setModules(data.modules);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...formData,
      image: formData.coverImage, // prisma field is 'image'
      durationDays: Number(formData.durationDays),
    };

    try {
      if (isNew) {
        const res = await createCourse(payload);
        if (!res.success) throw new Error(res.error);
        router.push("/admin/cursos");
      } else {
        const res = await updateCourse(id, payload);
        if (!res.success) throw new Error(res.error);
        router.push("/admin/cursos");
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    try {
      const res = await deleteCourse(id);
      if (!res.success) throw new Error(res.error);
      router.push("/admin/cursos");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/cursos" className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {isNew ? 'Nuevo Curso' : 'Editar Curso'}
          </h1>
        </div>
        {!isNew && (
          <button 
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
          >
            {deleting ? 'Eliminando...' : 'Eliminar Curso'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-8 border-b border-zinc-200 dark:border-zinc-800 mb-8">
        <button 
          className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setActiveTab('info')}
        >
          Información General
        </button>
        <button 
          disabled={isNew}
          title={isNew ? 'Guarda el curso primero para añadir currícula' : ''}
          className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'curriculum' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'} ${isNew ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isNew && setActiveTab('curriculum')}
        >
          Currícula
        </button>
      </div>

      {activeTab === 'info' ? (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Título del Curso</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Ej: Curso de React Avanzado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Slug (URL)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="curso-react-avanzado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Idioma</label>
                  <select 
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="es">Español (es)</option>
                    <option value="en">Inglés (en)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Descripción Corta</label>
                <textarea 
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Breve resumen para tarjetas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Descripción Detallada (Markdown)</label>
                <textarea 
                  rows={10}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y font-mono"
                  placeholder="Escribe el contenido detallado del curso..."
                />
              </div>
            </div>
          </div>

          {/* Sidebar Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                URL Imagen Portada
              </label>
              <input 
                type="url" 
                value={formData.coverImage}
                onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Tipo de Curso</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as CourseType})}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="Type1">Type1</option>
                <option value="Type2">Type2</option>
                <option value="Type3">Type3</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Modalidad</label>
                <select 
                  value={formData.modality}
                  onChange={(e) => setFormData({...formData, modality: e.target.value as Modality})}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Virtual">Virtual</option>
                  <option value="Presencial">Presencial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Sincronía</label>
                <select 
                  value={formData.synchronicity}
                  onChange={(e) => setFormData({...formData, synchronicity: e.target.value as Synchronicity})}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Asincronico">Asincrónico</option>
                  <option value="Sincronico">Sincrónico</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Duración (Días)</label>
              <input 
                type="number" 
                value={formData.durationDays}
                onChange={(e) => setFormData({...formData, durationDays: Number(e.target.value)})}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Translation Group ID</label>
              <input 
                type="text" 
                value={formData.translationGroupId}
                onChange={(e) => setFormData({...formData, translationGroupId: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Opcional..."
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <input 
                type="checkbox" 
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({...formData, published: e.target.checked})}
                className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="published" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Curso publicado
              </label>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 flex justify-end gap-4">
            <Link 
              href="/admin/cursos"
              className="px-6 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isNew ? 'Crear Curso' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      ) : (
        <CurriculumBuilder courseId={id} initialModules={modules} />
      )}
    </div>
  );
}

export default function CourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    }>
      <CourseEditorContent id={id} isNew={isNew} />
    </Suspense>
  );
}
