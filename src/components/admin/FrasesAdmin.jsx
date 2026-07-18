'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, ArrowUp, ArrowDown, CheckCircle2, XCircle, Loader2, Quote } from 'lucide-react'
import { renderEditorHtml } from '@/lib/html'

export default function FrasesAdmin() {
  const [phrases, setPhrases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [newPhrase, setNewPhrase] = useState({ textEs: '', textEn: '' })
  const [isCreating, setIsCreating] = useState(false)

  const fetchPhrases = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/frases')
      if (res.ok) {
        const data = await res.json()
        setPhrases(data)
        setDrafts(Object.fromEntries(data.map((p) => [p.id, { textEs: p.textEs, textEn: p.textEn }])))
      }
    } catch (error) {
      console.error('Error fetching phrases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPhrases()
  }, [])

  const updateDraft = (id, field, value) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const hasChanges = (phrase) => {
    const draft = drafts[phrase.id]
    return !!draft && (draft.textEs !== phrase.textEs || draft.textEn !== phrase.textEn)
  }

  const handleSave = async (phrase) => {
    const draft = drafts[phrase.id]
    if (!draft || !draft.textEs.trim() || !draft.textEn.trim()) {
      alert('Completá el texto en ambos idiomas.')
      return
    }
    setSavingId(phrase.id)
    try {
      const res = await fetch(`/api/admin/frases/${phrase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textEs: draft.textEs, textEn: draft.textEn }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPhrases((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        alert('Error al guardar la frase')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setSavingId(null)
    }
  }

  const handleToggleActive = async (phrase) => {
    try {
      const res = await fetch(`/api/admin/frases/${phrase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !phrase.isActive }),
      })
      if (res.ok) {
        const updated = await res.json()
        setPhrases((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que querés borrar esta frase?')) return
    try {
      const res = await fetch(`/api/admin/frases/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPhrases((prev) => prev.filter((p) => p.id !== id))
      } else {
        alert('Error al borrar la frase')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= phrases.length) return

    const current = phrases[index]
    const target = phrases[targetIndex]

    const reordered = [...phrases]
    reordered[index] = target
    reordered[targetIndex] = current
    setPhrases(reordered)

    try {
      await Promise.all([
        fetch(`/api/admin/frases/${current.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: target.order }),
        }),
        fetch(`/api/admin/frases/${target.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: current.order }),
        }),
      ])
      fetchPhrases()
    } catch (error) {
      alert('Error al reordenar')
      fetchPhrases()
    }
  }

  const handleCreate = async () => {
    if (!newPhrase.textEs.trim() || !newPhrase.textEn.trim()) {
      alert('Completá el texto en ambos idiomas.')
      return
    }
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/frases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhrase),
      })
      if (res.ok) {
        const created = await res.json()
        setPhrases((prev) => [...prev, created])
        setDrafts((prev) => ({ ...prev, [created.id]: { textEs: created.textEs, textEn: created.textEn } }))
        setNewPhrase({ textEs: '', textEn: '' })
      } else {
        alert('Error al crear la frase')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) return <div className="p-6 text-sel-body/70">Cargando frases...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-sel-purple dark:text-white mb-2">Frases del Home</h1>
        <p className="text-sel-body/70 dark:text-zinc-400">
          Frases que rotan una por una en la sección &quot;El Proceso&quot; de la portada, en el orden de esta lista.
          Envolvé una palabra entre <code className="px-1 py-0.5 rounded bg-sel-lavender/20 dark:bg-zinc-800">&lt;strong&gt;</code> y{' '}
          <code className="px-1 py-0.5 rounded bg-sel-lavender/20 dark:bg-zinc-800">&lt;/strong&gt;</code> para resaltarla en negrita.
        </p>
      </div>

      {/* Nueva frase */}
      <div className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-sel-purple dark:text-white uppercase tracking-wider mb-3">Nueva frase</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Español</label>
            <textarea
              value={newPhrase.textEs}
              onChange={(e) => setNewPhrase((p) => ({ ...p, textEs: e.target.value }))}
              placeholder="<strong>Sanación en Luz</strong> ..."
              rows={2}
              className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">English</label>
            <textarea
              value={newPhrase.textEn}
              onChange={(e) => setNewPhrase((p) => ({ ...p, textEn: e.target.value }))}
              placeholder="<strong>Sanación en Luz</strong> ..."
              rows={2}
              className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-sel-purple hover:bg-[#2a1f52] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar frase
        </button>
      </div>

      {/* Lista de frases */}
      {phrases.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-sel-lavender/30 dark:border-zinc-800 rounded-2xl">
          <Quote className="w-10 h-10 text-sel-lavender mx-auto mb-3" />
          <p className="text-sel-body/70 dark:text-zinc-400 font-medium">Todavía no hay frases cargadas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {phrases.map((phrase, index) => {
            const draft = drafts[phrase.id] || { textEs: phrase.textEs, textEn: phrase.textEn }
            return (
              <div key={phrase.id} className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 text-sel-body/50 hover:text-sel-purple disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Subir"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 1)}
                        disabled={index === phrases.length - 1}
                        className="p-0.5 text-sel-body/50 hover:text-sel-purple disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Bajar"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-sel-body/40">#{index + 1}</span>
                    <button
                      onClick={() => handleToggleActive(phrase)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        phrase.isActive
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Click para activar/desactivar"
                    >
                      {phrase.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {phrase.isActive ? 'Visible' : 'Oculta'}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(phrase.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Borrar frase"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Español</label>
                    <textarea
                      value={draft.textEs}
                      onChange={(e) => updateDraft(phrase.id, 'textEs', e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30 mb-2"
                    />
                    <p
                      className="text-[#33275f] dark:text-zinc-300 text-sm italic px-1"
                      dangerouslySetInnerHTML={{ __html: renderEditorHtml(draft.textEs) }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">English</label>
                    <textarea
                      value={draft.textEn}
                      onChange={(e) => updateDraft(phrase.id, 'textEn', e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30 mb-2"
                    />
                    <p
                      className="text-[#33275f] dark:text-zinc-300 text-sm italic px-1"
                      dangerouslySetInnerHTML={{ __html: renderEditorHtml(draft.textEn) }}
                    />
                  </div>
                </div>

                {hasChanges(phrase) && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleSave(phrase)}
                      disabled={savingId === phrase.id}
                      className="flex items-center gap-2 px-4 py-1.5 bg-sel-purple hover:bg-[#2a1f52] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingId === phrase.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Guardar cambios
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
