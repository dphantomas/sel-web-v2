'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Search, X, UserPlus, CalendarPlus, ChevronRight, ChevronDown, Loader2, Users, CalendarCheck, History, RefreshCw, Pencil,
} from 'lucide-react'
import { formatDateOnly, addDaysToDateOnly, nextSundayFromToday, capitalizeFirst, wasMemberAtMeeting, toDateInputValue } from '@/lib/dateOnly'

type UserLite = { id: string; firstName: string; lastName: string; email: string; image: string | null }

type Member = { id: string; userId: string; joinedAt: string | Date; user: UserLite }
type Meeting = { id: string; date: string | Date; notes: string | null; records: { id: string; userId: string }[] }

type Group = {
  id: string
  name: string
  description: string | null
  course: { id: string; title: string } | null
  courseInstance: { id: string; startDate: string | Date; course: { title: string } } | null
  members: Member[]
  meetings: Meeting[]
}

function suggestNextDate(meetings: Meeting[]): string {
  return meetings.length > 0 ? addDaysToDateOnly(meetings[0].date, 14) : nextSundayFromToday()
}

export default function GroupDetailAdmin({ group: initialGroup, allUsers }: { group: Group; allUsers: UserLite[] }) {
  const router = useRouter()
  const [group, setGroup] = useState(initialGroup)
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [editingJoinedAtId, setEditingJoinedAtId] = useState<string | null>(null)
  const [savingJoinedAtId, setSavingJoinedAtId] = useState<string | null>(null)

  const [isMembersOpen, setIsMembersOpen] = useState(group.members.length <= 8)
  const [isMeetingsOpen, setIsMeetingsOpen] = useState(true)

  const [isMeetingFormOpen, setIsMeetingFormOpen] = useState(false)
  const [meetingDate, setMeetingDate] = useState(() => suggestNextDate(initialGroup.meetings))
  const [meetingNotes, setMeetingNotes] = useState('')
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false)
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null)

  const memberUserIds = new Set(group.members.map((m) => m.userId))
  const sortedMembers = [...group.members].sort((a, b) =>
    (a.user.firstName || '').localeCompare(b.user.firstName || '', 'es', { sensitivity: 'base' })
  )

  const handleAddMember = async (userId: string) => {
    setAddingUserId(userId)
    try {
      const res = await fetch(`/api/admin/grupos/${group.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const member = await res.json()
        setGroup((g) => ({ ...g, members: [...g.members, member] }))
      } else {
        const err = await res.json()
        alert(err.error || 'Error al agregar miembro')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setAddingUserId(null)
    }
  }

  const handleRemoveMember = async (member: Member) => {
    setRemovingMemberId(member.id)
    try {
      const res = await fetch(`/api/admin/grupos/${group.id}/members/${member.userId}`, { method: 'DELETE' })
      if (res.ok) {
        setGroup((g) => ({ ...g, members: g.members.filter((m) => m.id !== member.id) }))
      } else {
        alert('Error al quitar miembro')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setRemovingMemberId(null)
    }
  }

  const handleUpdateJoinedAt = async (member: Member, newDate: string) => {
    if (!newDate) return
    setSavingJoinedAtId(member.id)
    try {
      const res = await fetch(`/api/admin/grupos/${group.id}/members/${member.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinedAt: newDate }),
      })
      if (res.ok) {
        const updated = await res.json()
        setGroup((g) => ({ ...g, members: g.members.map((m) => (m.id === member.id ? updated : m)) }))
      } else {
        alert('Error al actualizar la fecha de alta')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setSavingJoinedAtId(null)
      setEditingJoinedAtId(null)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch(`/api/admin/grupos/${group.id}/sincronizar`, { method: 'POST' })
      if (res.ok) {
        const { addedCount, members } = await res.json()
        if (addedCount > 0) {
          setGroup((g) => ({ ...g, members: [...g.members, ...members] }))
        }
        alert(
          addedCount > 0
            ? `Se ${addedCount === 1 ? 'agregó 1 persona nueva' : `agregaron ${addedCount} personas nuevas`}. No van a figurar en encuentros anteriores a hoy.`
            : 'Ya está actualizado: no hay gente nueva con acceso.'
        )
      } else {
        const err = await res.json()
        alert(err.error || 'Error al sincronizar')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleCreateMeeting = async () => {
    if (!meetingDate) {
      alert('Elegí una fecha para el encuentro.')
      return
    }
    setIsCreatingMeeting(true)
    try {
      const res = await fetch(`/api/admin/grupos/${group.id}/encuentros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: meetingDate, notes: meetingNotes || undefined }),
      })
      if (res.ok) {
        const meeting = await res.json()
        router.push(`/admin/grupos/${group.id}/encuentros/${meeting.id}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Error al crear el encuentro')
        setIsCreatingMeeting(false)
      }
    } catch {
      alert('Error de conexión')
      setIsCreatingMeeting(false)
    }
  }

  const handleDeleteMeeting = async (meeting: Meeting) => {
    if (!window.confirm(`¿Borrar el encuentro del ${formatDateOnly(meeting.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}? Se pierde la asistencia tomada.`)) return
    setDeletingMeetingId(meeting.id)
    try {
      const res = await fetch(`/api/admin/grupos/encuentros/${meeting.id}`, { method: 'DELETE' })
      if (res.ok) {
        setGroup((g) => ({ ...g, meetings: g.meetings.filter((m) => m.id !== meeting.id) }))
      } else {
        alert('Error al borrar el encuentro')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setDeletingMeetingId(null)
    }
  }

  const filteredCandidates = allUsers
    .filter((u) => !memberUserIds.has(u.id))
    .filter(
      (u) =>
        u.firstName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(memberSearch.toLowerCase())
    )
    .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || '', 'es', { sensitivity: 'base' }))

  const linkedLabel = group.courseInstance
    ? `${group.courseInstance.course.title} · ${formatDateOnly(group.courseInstance.startDate, { day: '2-digit', month: '2-digit', year: 'numeric' })}`
    : group.course
    ? group.course.title
    : null

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/grupos" className="p-2 bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-full hover:bg-sel-lavender/10 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-sel-purple dark:text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-sel-purple dark:text-white mb-1">{group.name}</h1>
          {group.description && <p className="text-sel-body/70 dark:text-zinc-400">{group.description}</p>}
          {linkedLabel && (
            <span className="inline-flex mt-2 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sel-lavender/20 dark:bg-zinc-800 text-sel-purple dark:text-zinc-300">
              {linkedLabel}
            </span>
          )}
        </div>
      </div>

      {/* Miembros */}
      <div className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-5 shadow-sm mb-6">
        <div className={`flex items-center justify-between ${isMembersOpen ? 'mb-4' : ''}`}>
          <button
            onClick={() => setIsMembersOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-sel-purple dark:text-white uppercase tracking-wider"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isMembersOpen ? '' : '-rotate-90'}`} />
            <Users className="w-4 h-4" />
            Miembros ({group.members.length})
          </button>
          <div className="flex items-center gap-2">
            {(group.course || group.courseInstance) && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                title="Agrega a quienes ganaron acceso al curso/instancia desde que se creó el grupo"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-sel-purple bg-sel-lavender/20 hover:bg-sel-lavender/40 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sincronizar
              </button>
            )}
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-sel-purple bg-sel-lavender/20 hover:bg-sel-lavender/40 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        {isMembersOpen && (group.members.length === 0 ? (
          <p className="text-sm text-sel-body/70 dark:text-zinc-400 py-4 text-center">Todavía no hay miembros en este grupo.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {sortedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-2 p-2.5 border border-sel-lavender/20 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  {member.user.image ? (
                    <img src={member.user.image} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-sel-lavender/30 dark:bg-zinc-700 flex items-center justify-center text-sel-purple dark:text-white text-xs font-bold shrink-0">
                      {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-sel-body dark:text-zinc-200 truncate">{member.user.firstName} {member.user.lastName}</p>
                    <p className="text-xs text-sel-body/50 dark:text-zinc-500 truncate">{member.user.email}</p>
                    {editingJoinedAtId === member.id ? (
                      <input
                        type="date"
                        autoFocus
                        defaultValue={toDateInputValue(member.joinedAt)}
                        disabled={savingJoinedAtId === member.id}
                        onBlur={(e) => (e.target.value ? handleUpdateJoinedAt(member, e.target.value) : setEditingJoinedAtId(null))}
                        onKeyDown={(e) => e.key === 'Escape' && setEditingJoinedAtId(null)}
                        className="mt-1 text-xs rounded border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 px-1.5 py-0.5"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingJoinedAtId(member.id)}
                        className="mt-0.5 flex items-center gap-1 text-[11px] text-sel-body/40 dark:text-zinc-500 hover:text-sel-purple dark:hover:text-white transition-colors"
                        title="Corregir fecha de alta (para cargar historial retroactivo)"
                      >
                        {savingJoinedAtId === member.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            Desde {formatDateOnly(member.joinedAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            <Pencil className="w-2.5 h-2.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member)}
                  disabled={removingMemberId === member.id}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
                  title="Quitar del grupo"
                >
                  {removingMemberId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Encuentros */}
      <div className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className={`flex items-center justify-between ${isMeetingsOpen ? 'mb-4' : ''}`}>
          <button
            onClick={() => setIsMeetingsOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-sel-purple dark:text-white uppercase tracking-wider"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isMeetingsOpen ? '' : '-rotate-90'}`} />
            <CalendarCheck className="w-4 h-4" />
            Encuentros ({group.meetings.length})
          </button>
          <div className="flex items-center gap-2">
            {group.meetings.length > 0 && (
              <Link
                href={`/admin/grupos/${group.id}/historial`}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-sel-purple bg-sel-lavender/20 hover:bg-sel-lavender/40 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                Ver historial
              </Link>
            )}
            <button
              onClick={() => {
                setMeetingDate(suggestNextDate(group.meetings))
                setIsMeetingFormOpen(true)
                setIsMeetingsOpen(true)
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-sel-purple hover:bg-[#2a1f52] text-white rounded-lg transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Nuevo encuentro
            </button>
          </div>
        </div>

        {isMeetingsOpen && (
        <>
        {isMeetingFormOpen && (
          <div className="mb-4 p-4 border border-sel-lavender/30 dark:border-zinc-800 rounded-xl bg-sel-cream/50 dark:bg-zinc-800/50">
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sel-body/70 dark:text-zinc-400 mb-1">Notas (opcional)</label>
                <input
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Tema del encuentro, lugar, etc."
                  className="w-full rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateMeeting}
                disabled={isCreatingMeeting}
                className="flex items-center gap-2 px-4 py-2 bg-sel-purple hover:bg-[#2a1f52] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isCreatingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Crear y tomar asistencia
              </button>
              <button onClick={() => setIsMeetingFormOpen(false)} className="px-4 py-2 text-sm font-medium text-sel-body/70 dark:text-zinc-400 hover:text-sel-purple dark:hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {group.meetings.length === 0 ? (
          <p className="text-sm text-sel-body/70 dark:text-zinc-400 py-4 text-center">Todavía no hay encuentros registrados.</p>
        ) : (
          <div className="space-y-2">
            {group.meetings.map((meeting) => {
              const eligibleIds = new Set(
                group.members.filter((m) => wasMemberAtMeeting(m.joinedAt, meeting.date)).map((m) => m.userId)
              )
              return (
              <div key={meeting.id} className="flex items-center justify-between gap-3 p-3 border border-sel-lavender/20 dark:border-zinc-800 rounded-xl hover:bg-sel-lavender/5 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sel-body dark:text-zinc-200">
                    {capitalizeFirst(formatDateOnly(meeting.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }))}
                  </p>
                  <p className="text-xs text-sel-body/60 dark:text-zinc-500">
                    {meeting.records.filter((r) => eligibleIds.has(r.userId)).length}/{eligibleIds.size} presentes
                    {meeting.notes ? ` · ${meeting.notes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/grupos/${group.id}/encuentros/${meeting.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sel-purple bg-sel-lavender/20 hover:bg-sel-lavender/40 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-lg transition-colors"
                  >
                    Tomar lista
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDeleteMeeting(meeting)}
                    disabled={deletingMeetingId === meeting.id}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Borrar encuentro"
                  >
                    {deletingMeetingId === meeting.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        )}
        </>
        )}
      </div>

      {/* MODAL AGREGAR MIEMBRO */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-sel-lavender/20 dark:border-zinc-800 flex justify-between items-start">
              <h2 className="text-lg font-bold text-sel-purple dark:text-white">Agregar miembro a {group.name}</h2>
              <button
                onClick={() => {
                  setIsMemberModalOpen(false)
                  setMemberSearch('')
                }}
                className="text-sel-body/50 dark:text-zinc-400 hover:text-sel-purple dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-sel-lavender/20 dark:border-zinc-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sel-body/40 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-sel-lavender/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-sel-purple/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredCandidates.length === 0 ? (
                <p className="text-sm text-sel-body/60 dark:text-zinc-500 text-center py-6">Sin resultados.</p>
              ) : (
                filteredCandidates.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleAddMember(u.id)}
                    disabled={addingUserId === u.id}
                    className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-sel-lavender/10 dark:hover:bg-zinc-800 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.image ? (
                        <img src={u.image} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-sel-lavender/30 dark:bg-zinc-700 flex items-center justify-center text-sel-purple dark:text-white text-xs font-bold shrink-0">
                          {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sel-body dark:text-zinc-200 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-sel-body/50 dark:text-zinc-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    {addingUserId === u.id ? <Loader2 className="w-4 h-4 animate-spin text-sel-purple shrink-0" /> : <Plus className="w-4 h-4 text-sel-purple dark:text-zinc-400 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
