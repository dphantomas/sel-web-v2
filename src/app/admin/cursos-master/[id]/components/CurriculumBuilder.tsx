"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GripVertical, ChevronDown, ChevronRight, Video, FileText, Loader2, PlayCircle } from "lucide-react";
import { createModule, updateModule, deleteModule, createLesson, updateLesson, deleteLesson } from "@/modules/courses/curriculum-actions";

type Lesson = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  duration: number | null;
  order: number;
  isFree: boolean;
  moduleId: string;
};

type Module = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

export function CurriculumBuilder({ courseId, initialModules }: { courseId: string, initialModules: Module[] }) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(initialModules.map(m => m.id)));
  const [loading, setLoading] = useState(false);

  // Modals state
  const [editingModule, setEditingModule] = useState<{ id?: string, title: string } | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ 
    id?: string, 
    moduleId: string, 
    title: string, 
    slug: string, 
    description: string, 
    videoUrl: string, 
    duration: number, 
    isFree: boolean 
  } | null>(null);

  const toggleModule = (id: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedModules(newExpanded);
  };

  // --- MODULE ACTIONS ---
  const handleSaveModule = async () => {
    if (!editingModule || !editingModule.title.trim()) return;
    setLoading(true);

    try {
      if (editingModule.id) {
        // Edit
        await updateModule(editingModule.id, editingModule.title);
        setModules(modules.map(m => m.id === editingModule.id ? { ...m, title: editingModule.title } : m));
      } else {
        // Create
        const order = modules.length > 0 ? Math.max(...modules.map(m => m.order)) + 1 : 0;
        const res = await createModule(courseId, editingModule.title, order);
        if (res.success && res.moduleId) {
          const newModule = { id: res.moduleId, title: editingModule.title, order, lessons: [] };
          setModules([...modules, newModule]);
          const newExpanded = new Set(expandedModules);
          newExpanded.add(res.moduleId);
          setExpandedModules(newExpanded);
        }
      }
    } finally {
      setEditingModule(null);
      setLoading(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm("¿Eliminar este módulo y TODAS sus lecciones?")) return;
    setLoading(true);
    await deleteModule(id);
    setModules(modules.filter(m => m.id !== id));
    setLoading(false);
  };

  // --- LESSON ACTIONS ---
  const handleSaveLesson = async () => {
    if (!editingLesson || !editingLesson.title.trim()) return;
    setLoading(true);
    
    try {
      const payload = {
        title: editingLesson.title,
        slug: editingLesson.slug,
        description: editingLesson.description,
        videoUrl: editingLesson.videoUrl,
        duration: Number(editingLesson.duration),
        isFree: editingLesson.isFree
      };

      if (editingLesson.id) {
        // Update
        await updateLesson(editingLesson.id, payload);
        setModules(modules.map(m => {
          if (m.id === editingLesson.moduleId) {
            return {
              ...m,
              lessons: m.lessons.map(l => l.id === editingLesson.id ? { ...l, ...payload } as Lesson : l)
            };
          }
          return m;
        }));
      } else {
        // Create
        const targetModule = modules.find(m => m.id === editingLesson.moduleId);
        const order = (targetModule?.lessons.length || 0) > 0 ? Math.max(...targetModule!.lessons.map(l => l.order)) + 1 : 0;
        
        const res = await createLesson(editingLesson.moduleId, { ...payload, order });
        if (res.success && res.lessonId) {
          setModules(modules.map(m => {
            if (m.id === editingLesson.moduleId) {
              return { ...m, lessons: [...m.lessons, { ...payload, id: res.lessonId, moduleId: editingLesson.moduleId, order }] };
            }
            return m;
          }));
        }
      }
    } finally {
      setEditingLesson(null);
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    if (!confirm("¿Eliminar esta lección?")) return;
    setLoading(true);
    await deleteLesson(lessonId);
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
      }
      return m;
    }));
    setLoading(false);
  };

  // Modal ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingModule(null);
        setEditingLesson(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Constructor de Currícula</h2>
        <button 
          onClick={() => setEditingModule({ title: "" })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir Módulo
        </button>
      </div>

      <div className="space-y-4">
        {modules.map((module, idx) => (
          <div key={module.id} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleModule(module.id)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  {expandedModules.has(module.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <GripVertical className="w-5 h-5 text-zinc-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing" />
                <h3 className="font-bold text-zinc-900 dark:text-white">
                  <span className="text-zinc-400 font-mono mr-2">M{idx + 1}</span>
                  {module.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingModule({ id: module.id, title: module.title })} className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteModule(module.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedModules.has(module.id) && (
              <div className="p-4 space-y-3">
                {module.lessons.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic px-8">No hay lecciones en este módulo.</p>
                ) : (
                  module.lessons.map((lesson, lIdx) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 group">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                            {lesson.videoUrl ? <PlayCircle className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-zinc-400" />}
                            {lesson.title}
                            {lesson.isFree && <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">Free</span>}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingLesson({...lesson, description: lesson.description || "", videoUrl: lesson.videoUrl || "", duration: lesson.duration || 0})} className="p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteLesson(lesson.id, module.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                
                <div className="px-8 pt-2">
                  <button 
                    onClick={() => setEditingLesson({ moduleId: module.id, title: "", slug: "", description: "", videoUrl: "", duration: 0, isFree: false })}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir Lección
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODULE MODAL */}
      {editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{editingModule.id ? 'Editar Módulo' : 'Nuevo Módulo'}</h3>
              <input 
                autoFocus
                type="text"
                placeholder="Título del Módulo"
                value={editingModule.title}
                onChange={(e) => setEditingModule({...editingModule, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveModule()}
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditingModule(null)} className="px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
                <button onClick={handleSaveModule} disabled={loading} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LESSON MODAL */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingLesson.id ? 'Editar Lección' : 'Nueva Lección'}</h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Título</label>
                  <input type="text" value={editingLesson.title} onChange={e => setEditingLesson({...editingLesson, title: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                  <input type="text" value={editingLesson.slug} onChange={e => setEditingLesson({...editingLesson, slug: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Duración (min)</label>
                  <input type="number" value={editingLesson.duration} onChange={e => setEditingLesson({...editingLesson, duration: Number(e.target.value)})} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Video URL (YouTube/R2)</label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Video className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                      <input type="url" value={editingLesson.videoUrl} onChange={e => setEditingLesson({...editingLesson, videoUrl: e.target.value})} className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg" placeholder="https://..." />
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripción / Notas (Markdown)</label>
                  <textarea rows={5} value={editingLesson.description} onChange={e => setEditingLesson({...editingLesson, description: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm resize-y" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingLesson.isFree} onChange={e => setEditingLesson({...editingLesson, isFree: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                    <span className="text-sm font-medium">Lección Gratuita (Previsualización)</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
              <button onClick={() => setEditingLesson(null)} className="px-4 py-2 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg">Cancelar</button>
              <button onClick={handleSaveLesson} disabled={loading} className="px-6 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar Lección'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
