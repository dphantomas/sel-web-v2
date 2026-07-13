"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Loader2, Image as ImageIcon, UploadCloud } from "lucide-react";
import { createPost, updatePost, deletePost } from "@/modules/blog/actions";
import { CldUploadWidget } from "next-cloudinary";

// En Next.js 15+ params puede ser una promesa, así que lo envolvemos y unwrap si es necesario.
import { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function BlogEditorContent({ id, isNew }: { id: string, isNew: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdFromUrl = searchParams.get('groupId');
  const targetLangFromUrl = searchParams.get('targetLang');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    language: targetLangFromUrl || "es",
    excerpt: "",
    content: "",
    coverImage: "",
    published: false,
    translationGroupId: groupIdFromUrl || "",
  });

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    fetch(`/api/admin/blog/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('No encontrado');
        return res.json();
      })
      .then((data) => {
        setFormData({
          title: data.title,
          slug: data.slug,
          language: data.language,
          excerpt: data.excerpt || "",
          content: data.content,
          coverImage: data.coverImage || "",
          published: data.published,
          translationGroupId: data.translationGroupId || "",
        });
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isNew]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      // Si el slug está vacío o auto-generado, actualizarlo
      slug: prev.slug === generateSlug(prev.title) || prev.slug === '' ? generateSlug(title) : prev.slug
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const action = isNew ? createPost : updatePost.bind(null, id);
    
    // Si usamos bind(null, id), createPost no toma id.
    const result = await (isNew ? createPost(formData) : updatePost(id, formData));

    if (result.success) {
      router.push('/admin/blog');
    } else {
      setError(result.error || "Error al guardar");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este artículo de forma permanente?")) return;
    
    setDeleting(true);
    const result = await deletePost(id);
    if (result.success) {
      router.push('/admin/blog');
    } else {
      setError(result.error || "Error al eliminar");
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
          <Link href="/admin/blog" className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {isNew ? 'Crear Nuevo Artículo' : 'Editar Artículo'}
          </h1>
        </div>
        {!isNew && (
          <button 
            type="button" 
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Eliminar
          </button>
        )}
      </div>

      {error && (
        <div className="mb-8 p-4 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Panel Principal */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Título del Artículo</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Ej: Novedades de React 19"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Slug (URL amigable)</label>
              <input 
                type="text" 
                required
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Resumen (Excerpt)</label>
            <textarea 
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder="Breve descripción para la grilla de artículos..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Contenido (Markdown)</label>
            </div>
            <textarea 
              required
              rows={15}
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="# Escribe aquí el contenido..."
            />
            <p className="text-xs text-zinc-500 mt-2">Próximamente editor WYSIWYG. Por ahora, utilizá sintaxis Markdown.</p>
          </div>
        </div>

        {/* Panel Lateral/Extra */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Imagen de Portada
            </label>
            <div className="flex gap-2">
              <input 
                type="url" 
                value={formData.coverImage}
                onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                className="flex-1 min-w-0 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="https://..."
              />
              <CldUploadWidget 
                signatureEndpoint="/api/media/cloudinary-sign?folder=blog"
                onSuccess={(result: any) => {
                  if (result?.info?.secure_url) {
                    setFormData(prev => ({ ...prev, coverImage: result.info.secure_url }));
                  }
                }}
                options={{
                  multiple: false,
                  resourceType: "image",
                  folder: "sanacion-en-luz/blog"
                }}
              >
                {({ open }) => {
                  return (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); open(); }}
                      className="px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 font-medium rounded-xl text-sm transition-colors flex items-center gap-2 shrink-0"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Subir
                    </button>
                  );
                }}
              </CldUploadWidget>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Translation Group ID (Opcional)</label>
            <input 
              type="text" 
              value={formData.translationGroupId}
              onChange={(e) => setFormData({...formData, translationGroupId: e.target.value})}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="ID compartido para vincular traducciones"
            />
            <p className="text-xs text-zinc-500 mt-1">Dejar en blanco para generar uno nuevo, o rellenar para vincular a una traducción existente.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({...formData, published: e.target.checked})}
              className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Artículo publicado (visible públicamente)
            </label>
          </div>
        </div>

        {/* Acciones Footer */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link 
            href="/admin/blog"
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
            {isNew ? 'Publicar Artículo' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useParams } from "next/navigation";

export default function BlogEditorPage() {
  const params = useParams();
  const id = params?.id as string;
  
  if (!id) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const isNew = id === 'new';

  return (
    <BlogEditorContent id={id} isNew={isNew} />
  );
}
