'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Loader2, CheckCheck, RotateCcw, Save } from 'lucide-react'
import { formatDateOnly, toDateInputValue, capitalizeFirst, wasMemberAtMeeting } from '@/lib/dateOnly'
import { STATUS_CONFIG, type AttendanceStatus as Status } from '@/lib/attendanceStatus'

type UserLite = { id: string; firstName: string; lastName: string; email: string; image: string | null }
type Member = { id: string; userId: string; joinedAt: string | Date; user: UserLite }
type AttendanceRow = { id: string; userId: string; status: Status }
type Meeting = {
  id: string
  date: string | Date
  notes: string | null
  group: { id: string; name: string; members: Member[] }
  records: AttendanceRow[]
}

export default function AttendanceSheet({ meeting }: { meeting: Meeting }) {
  const [rows, setRows] = useState<AttendanceRow[]>(meeting.records)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [savedDate, setSavedDate] = useState(meeting.date)
  const [savedNotes, setSavedNotes] = useState(meeting.notes)
  const [dateDraft, setDateDraft] = useState(toDateInputValue(meeting.date))
  const [notesDraft, setNotesDraft] = useState(meeting.notes || '')
  const [isSavingMeta, setIsSavingMeta] = useState(false)
  const metaDirty = dateDraft !== toDateInputValue(savedDate) || notesDraft !== (savedNotes || '')

  const statusByUser = useMemo(() => {
    const map = new Map<string, Status>()
    rows.forEach((r) => map.set(r.userId, r.status))
    return map
  }, [rows])

  // Sólo entra al roster de este encuentro quien ya era miembro del grupo esa
  // fecha; alguien sumado después (a mano o por sincronización con el curso)
  // no figura en encuentros anteriores a su alta.
  const eligibleMembers = meeting.group.members.filter((m) => wasMemberAtMeeting(m.joinedAt, meeting.date))

  const total = eligibleMembers.length
  // `rows` puede tener marcas huérfanas de gente que ya no es miembro del
  // grupo (se sacó a alguien después de tomarle asistencia); no deben sumar
  // en los conteos que se muestran junto al total de miembros elegibles.
  const memberIds = new Set(eligibleMembers.map((m) => m.userId))
  const visibleRows = rows.filter((r) => memberIds.has(r.userId))
  const counts = STATUS_CONFIG.map((cfg) => ({ ...cfg, count: visibleRows.filter((r) => r.status === cfg.value).length }))
  const unmarkedCount = total - visibleRows.length

  const sortedMembers = [...eligibleMembers].sort((a, b) =>
    (a.user.firstName || '').localeCompare(b.user.firstName || '', 'es', { sensitivity: 'base' })
  )

  const filteredMembers = sortedMembers.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.user.firstName?.toLowerCase().includes(q) ||
      m.user.lastName?.toLowerCase().includes(q) ||
      m.user.email?.toLowerCase().includes(q)
    )
  })

  const setStatus = async (userId: string, status: Status) => {
    const previous = statusByUser.get(userId) ?? null
    setSavingUserId(userId)
    setRows((prev) => {
      const existing = prev.find((r) => r.userId === userId)
      if (existing) return prev.map((r) => (r.userId === userId ? { ...r, status } : r))
      return [...prev, { id: `optimistic-${userId}`, userId, status }]
    })
    try {
      const res = await fetch(`/api/admin/grupos/encuentros/${meeting.id}/asistencia`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setRows((prev) =>
        previous === null ? prev.filter((r) => r.userId !== userId) : prev.map((r) => (r.userId === userId ? { ...r, status: previous } : r))
      )
      alert('No se pudo guardar. Probá de nuevo.')
    } finally {
      setSavingUserId(null)
    }
  }

  const clearStatus = async (userId: string) => {
    const previous = statusByUser.get(userId) ?? null
    if (previous === null) return
    setSavingUserId(userId)
    setRows((prev) => prev.filter((r) => r.userId !== userId))
    try {
      const res = await fetch(`/api/admin/grupos/encuentros/${meeting.id}/asistencia`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setRows((prev) => [...prev, { id: `optimistic-${userId}`, userId, status: previous }])
      alert('No se pudo guardar. Probá de nuevo.')
    } finally {
      setSavingUserId(null)
    }
  }

  const markAllPresente = async () => {
    const targets = sortedMembers.filter((m) => statusByUser.get(m.userId) !== 'Presente')
    if (targets.length === 0) return
    const snapshot = rows
    setRows((prev) => {
      const map = new Map(prev.map((r) => [r.userId, r] as const))
      targets.forEach((m) => map.set(m.userId, { id: map.get(m.userId)?.id || `optimistic-${m.userId}`, userId: m.userId, status: 'Presente' }))
      return Array.from(map.values())
    })
    const results = await Promise.all(
      targets.map(async (m) => {
        try {
          const res = await fetch(`/api/admin/grupos/encuentros/${meeting.id}/asistencia`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: m.userId, status: 'Presente' }),
          })
          return { userId: m.userId, ok: res.ok }
        } catch {
          return { userId: m.userId, ok: false }
        }
      })
    )
    const failedIds = new Set(results.filter((r) => !r.ok).map((r) => r.userId))
    if (failedIds.size > 0) {
      setRows((prev) => [...prev.filter((r) => !failedIds.has(r.userId)), ...snapshot.filter((r) => failedIds.has(r.userId))])
      alert(`No se pudo actualizar a ${failedIds.size} ${failedIds.size === 1 ? 'persona' : 'personas'}. Probá de nuevo.`)
    }
  }

  const resetAll = async () => {
    const targets = sortedMembers.filter((m) => statusByUser.has(m.userId))
    if (targets.length === 0) return
    if (!window.confirm('¿Reiniciar la lista? Se borran todas las marcas de este encuentro.')) return
    const snapshot = rows
    setRows((prev) => prev.filter((r) => !targets.some((m) => m.userId === r.userId)))
    const results = await Promise.all(
      targets.map(async (m) => {
        try {
          const res = await fetch(`/api/admin/grupos/encuentros/${meeting.id}/asistencia`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: m.userId }),
          })
          return { userId: m.userId, ok: res.ok }
        } catch {
          return { userId: m.userId, ok: false }
        }
      })
    )
    const failedIds = new Set(results.filter((r) => !r.ok).map((r) => r.userId))
    if (failedIds.size > 0) {
      setRows((prev) => [...prev, ...snapshot.filter((r) => failedIds.has(r.userId))])
      alert(`No se pudo borrar la marca de ${failedIds.size} ${failedIds.size === 1 ? 'persona' : 'personas'}. Probá de nuevo.`)
    }
  }

  const handleSaveMeta = async () => {
    setIsSavingMeta(true)
    try {
      const res = await fetch(`/api/admin/grupos/encuentros/${meeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateDraft, notes: notesDraft || null }),
      })
      if (!res.ok) alert('Error al guardar la fecha/notas')
      else {
        setSavedDate(dateDraft)
        setSavedNotes(notesDraft || null)
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setIsSavingMeta(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin/grupos/${meeting.group.id}`}
          className="p-2 bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-full hover:bg-sel-lavender/10 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-sel-purple dark:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sel-purple dark:text-white">{meeting.group.name}</h1>
          <p className="text-sel-body/70 dark:text-zinc-400 text-sm">
            {capitalizeFirst(formatDateOnly(savedDate, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))}
          </p>
        </div>
      </div>

      {/* Fecha / notas editables */}
      <div className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-4 mb-4 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Fecha del encuentro</label>
            <input
              type="date"
              value={dateDraft}
              onChange={(e) => setDateDraft(e.target.value)}
              className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Notas</label>
            <input
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Opcional"
              className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
            />
          </div>
        </div>
        {metaDirty && (
          <button
            onClick={handleSaveMeta}
            disabled={isSavingMeta}
            className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-sel-purple hover:bg-[#2a1f52] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSavingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        )}
      </div>

      {/* Barra de resumen, sticky para verla mientras se scrollea la lista */}
      <div className="sticky top-0 z-10 bg-sel-cream dark:bg-zinc-950 pt-1 pb-3 -mx-1 px-1">
        <div className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {counts.map((cfg) => (
                <span key={cfg.value} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-sel-lavender/10 dark:bg-zinc-800 text-sel-body dark:text-zinc-300">
                  <cfg.icon className="w-3 h-3" />
                  {cfg.count} {cfg.shortLabel}
                </span>
              ))}
              {unmarkedCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-sel-lavender/10 dark:bg-zinc-800 text-sel-body/50 dark:text-zinc-500">
                  {unmarkedCount} sin marcar
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllPresente}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Todos presentes
              </button>
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sel-body/70 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sel-body/40 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar persona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
            />
          </div>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-sel-body/70 dark:text-zinc-400 text-center py-8">
          {meeting.group.members.length === 0
            ? 'Este grupo todavía no tiene miembros. Agregalos desde la página del grupo antes de tomar asistencia.'
            : 'Ninguno de los miembros actuales del grupo ya era parte de él en esta fecha.'}
        </p>
      ) : filteredMembers.length === 0 ? (
        <p className="text-sm text-sel-body/70 dark:text-zinc-400 text-center py-8">Sin resultados para &quot;{search}&quot;.</p>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member) => {
            const status = statusByUser.get(member.userId) ?? null
            const activeCfg = STATUS_CONFIG.find((c) => c.value === status)
            const isSaving = savingUserId === member.userId
            return (
              <div
                key={member.id}
                className={`p-3 rounded-2xl border transition-colors ${activeCfg ? activeCfg.card : 'bg-white border-sel-lavender/30 dark:bg-zinc-900 dark:border-zinc-800'}`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  {member.user.image ? (
                    <img src={member.user.image} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-sel-lavender/30 dark:bg-zinc-700 flex items-center justify-center text-sel-purple dark:text-white text-xs font-bold shrink-0">
                      {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-sel-body dark:text-zinc-200 truncate">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    <p className="text-xs text-sel-body/50 dark:text-zinc-500 truncate">{member.user.email}</p>
                  </div>
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin text-sel-body/40 dark:text-zinc-500 shrink-0" />}
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {STATUS_CONFIG.map((cfg) => {
                    const isActive = status === cfg.value
                    return (
                      <button
                        key={cfg.value}
                        onClick={() => (isActive ? clearStatus(member.userId) : setStatus(member.userId, cfg.value))}
                        disabled={isSaving}
                        title={cfg.label}
                        className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border text-[10px] font-medium leading-none transition-colors disabled:opacity-50 ${
                          isActive
                            ? `${cfg.solid} border-transparent`
                            : 'bg-white dark:bg-zinc-800 border-sel-lavender/30 dark:border-zinc-700 text-sel-body/70 dark:text-zinc-400'
                        }`}
                      >
                        <cfg.icon className="w-4 h-4" />
                        <span>{cfg.shortLabel}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
