'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Users, CalendarCheck, Trash2, ChevronRight, Loader2, UsersRound } from 'lucide-react'
import { formatDateOnly, capitalizeFirst } from '@/lib/dateOnly'

type Instance = { id: string; startDate: string | Date; location: string | null }
type Course = { id: string; title: string; instances: Instance[] }

type Group = {
  id: string
  name: string
  description: string | null
  courseId: string | null
  courseInstanceId: string | null
  course: { id: string; title: string } | null
  courseInstance: { id: string; startDate: string | Date; course: { title: string } } | null
  _count: { members: number; meetings: number }
  meetings: { date: string | Date }[]
}

export default function GroupsAdmin({ initialGroups, courses }: { initialGroups: Group[]; courses: Course[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', courseId: '', courseInstanceId: '' })

  const selectedCourse = courses.find((c) => c.id === form.courseId)

  const resetForm = () => {
    setForm({ name: '', description: '', courseId: '', courseInstanceId: '' })
    setIsFormOpen(false)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) {
      alert('Poné un nombre para el grupo.')
      return
    }
    setIsCreating(true)
    try {
      const res = await fetch('/api/admin/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          courseId: form.courseId || undefined,
          courseInstanceId: form.courseInstanceId || undefined,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        const course = courses.find((c) => c.id === created.courseId) || null
        const instance = course?.instances.find((i) => i.id === created.courseInstanceId) || null
        setGroups((prev) =>
          [
            ...prev,
            {
              ...created,
              course: course ? { id: course.id, title: course.title } : null,
              courseInstance: instance ? { id: instance.id, startDate: instance.startDate, course: { title: course!.title } } : null,
              _count: created._count,
              meetings: [],
            },
          ].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
        )
        resetForm()
      } else {
        const err = await res.json()
        alert(err.error || 'Error al crear el grupo')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (group: Group) => {
    if (!window.confirm(`¿Seguro que querés borrar el grupo "${group.name}"? Se pierden sus encuentros y asistencia registrada.`)) return
    setDeletingId(group.id)
    try {
      const res = await fetch(`/api/admin/grupos/${group.id}`, { method: 'DELETE' })
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== group.id))
      } else {
        alert('Error al borrar el grupo')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-sel-purple dark:text-white">Grupos y Asistencia</h1>
            <span className="text-sm text-sel-purple dark:text-white font-bold bg-sel-cream dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-sel-lavender/30 dark:border-zinc-700">
              {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
            </span>
          </div>
          <p className="text-sel-body/70 dark:text-zinc-400">Grupos de encuentro recurrente y toma de lista por fecha.</p>
        </div>
        <button
          onClick={() => setIsFormOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-sel-purple hover:bg-[#2a1f52] text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo grupo
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="text-sm font-bold text-sel-purple dark:text-white uppercase tracking-wider mb-3">Nuevo grupo</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Grupo de crecimiento A"
                className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Descripción</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Opcional"
                className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Curso vinculado</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value, courseInstanceId: '' }))}
                className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
              >
                <option value="">Ninguno (grupo independiente)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Instancia puntual</label>
              <select
                value={form.courseInstanceId}
                onChange={(e) => setForm((f) => ({ ...f, courseInstanceId: e.target.value }))}
                disabled={!selectedCourse}
                className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30 disabled:opacity-50"
              >
                <option value="">Todo el curso (sin instancia puntual)</option>
                {selectedCourse?.instances.map((i) => (
                  <option key={i.id} value={i.id}>{formatDateOnly(i.startDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}{i.location ? ` — ${i.location}` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          {(form.courseId || form.courseInstanceId) && (
            <p className="text-xs text-sel-body/60 dark:text-zinc-500 mb-4">
              Se agregan automáticamente como miembros las personas que ya tienen acceso a {form.courseInstanceId ? 'esa instancia' : 'ese curso'}. Después podés sumar o sacar gente a mano desde la página del grupo.
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-sel-purple hover:bg-[#2a1f52] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear grupo
            </button>
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium text-sel-body/70 dark:text-zinc-400 hover:text-sel-purple dark:hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-sel-lavender/30 dark:border-zinc-800 rounded-2xl">
          <UsersRound className="w-10 h-10 text-sel-lavender mx-auto mb-3" />
          <p className="text-sel-body/70 dark:text-zinc-400 font-medium">Todavía no hay grupos creados.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const lastMeeting = group.meetings[0]
            const linkedLabel = group.courseInstance
              ? `${group.courseInstance.course.title} · ${formatDateOnly(group.courseInstance.startDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}`
              : group.course
              ? group.course.title
              : null

            return (
              <div key={group.id} className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sel-purple dark:text-white">{group.name}</h3>
                  <button
                    onClick={() => handleDelete(group)}
                    disabled={deletingId === group.id}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
                    title="Borrar grupo"
                  >
                    {deletingId === group.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                {group.description && (
                  <p className="text-sm text-sel-body/70 dark:text-zinc-400 mb-3">{group.description}</p>
                )}

                {linkedLabel && (
                  <span className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sel-lavender/20 dark:bg-zinc-800 text-sel-purple dark:text-zinc-300 mb-3">
                    {linkedLabel}
                  </span>
                )}

                <div className="flex items-center gap-4 text-sm text-sel-body/70 dark:text-zinc-400 mb-4 mt-auto pt-3">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {group._count.members} {group._count.members === 1 ? 'persona' : 'personas'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4" />
                    {group._count.meetings} {group._count.meetings === 1 ? 'encuentro' : 'encuentros'}
                  </span>
                </div>

                {lastMeeting && (
                  <p className="text-xs text-sel-body/50 dark:text-zinc-500 mb-3">
                    Último encuentro: {capitalizeFirst(formatDateOnly(lastMeeting.date, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }))}
                  </p>
                )}

                <Link
                  href={`/admin/grupos/${group.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-sel-lavender/20 dark:bg-zinc-800 hover:bg-sel-lavender/40 dark:hover:bg-zinc-700 text-sel-purple dark:text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Ver grupo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
