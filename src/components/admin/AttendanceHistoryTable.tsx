import Link from 'next/link'
import { ArrowLeft, History } from 'lucide-react'
import { formatDateOnly, wasMemberAtMeeting } from '@/lib/dateOnly'
import { STATUS_CONFIG, statusConfig, type AttendanceStatus } from '@/lib/attendanceStatus'

type UserLite = { id: string; firstName: string; lastName: string; email: string; image: string | null }
type Member = { id: string; userId: string; joinedAt: string | Date; user: UserLite }
type Meeting = { id: string; date: string | Date; notes: string | null; records: { userId: string; status: AttendanceStatus }[] }
type Group = { id: string; name: string; members: Member[]; meetings: Meeting[] }

export default function AttendanceHistoryTable({ group }: { group: Group }) {
  const sortedMembers = [...group.members].sort((a, b) =>
    (a.user.firstName || '').localeCompare(b.user.firstName || '', 'es', { sensitivity: 'base' })
  )

  // Encuentros más recientes primero: es lo que un admin suele querer ver
  // primero al abrir el historial, sin tener que desplazarse.
  const meetings = group.meetings

  const statusMap = new Map<string, AttendanceStatus>()
  meetings.forEach((m) => m.records.forEach((r) => statusMap.set(`${m.id}:${r.userId}`, r.status)))
  const statusAt = (meetingId: string, userId: string): AttendanceStatus | null => statusMap.get(`${meetingId}:${userId}`) ?? null

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/admin/grupos/${group.id}`}
          className="p-2 bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-full hover:bg-sel-lavender/10 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-sel-purple dark:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sel-purple dark:text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de {group.name}
          </h1>
          <p className="text-sel-body/70 dark:text-zinc-400 text-sm">
            {sortedMembers.length} {sortedMembers.length === 1 ? 'persona' : 'personas'} · {meetings.length} {meetings.length === 1 ? 'encuentro' : 'encuentros'}
          </p>
        </div>
      </div>

      {/* Referencia de íconos */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {STATUS_CONFIG.map((cfg) => (
          <span key={cfg.value} className="inline-flex items-center gap-1.5 text-xs text-sel-body/70 dark:text-zinc-400">
            <span className={`w-5 h-5 rounded-md flex items-center justify-center ${cfg.solid}`}>
              <cfg.icon className="w-3 h-3" />
            </span>
            {cfg.label}
          </span>
        ))}
      </div>

      {sortedMembers.length === 0 ? (
        <p className="text-sm text-sel-body/70 dark:text-zinc-400 text-center py-12 border-2 border-dashed border-sel-lavender/30 dark:border-zinc-800 rounded-2xl">
          Este grupo todavía no tiene miembros.
        </p>
      ) : meetings.length === 0 ? (
        <p className="text-sm text-sel-body/70 dark:text-zinc-400 text-center py-12 border-2 border-dashed border-sel-lavender/30 dark:border-zinc-800 rounded-2xl">
          Este grupo todavía no tiene encuentros registrados.
        </p>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-sel-lavender/30 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr className="bg-sel-lavender/10 dark:bg-zinc-800/60 border-b border-sel-lavender/30 dark:border-zinc-800">
                  <th className="sticky left-0 z-10 bg-sel-lavender/10 dark:bg-zinc-800/60 px-4 py-3 text-left text-xs font-bold text-sel-purple dark:text-white uppercase tracking-wider whitespace-nowrap">
                    Persona
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-sel-purple dark:text-white uppercase tracking-wider whitespace-nowrap border-l border-sel-lavender/20 dark:border-zinc-800">
                    Presentes
                  </th>
                  {meetings.map((m) => (
                    <th key={m.id} className="px-2 py-3 text-center text-xs font-medium text-sel-body/70 dark:text-zinc-400 whitespace-nowrap border-l border-sel-lavender/20 dark:border-zinc-800">
                      <Link href={`/admin/grupos/${group.id}/encuentros/${m.id}`} className="hover:text-sel-purple dark:hover:text-white transition-colors" title={formatDateOnly(m.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}>
                        {formatDateOnly(m.date, { day: '2-digit', month: '2-digit' })}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sel-lavender/20 dark:divide-zinc-800">
                {sortedMembers.map((member) => {
                  // Sólo cuentan los encuentros en los que ya era miembro: no
                  // se le "debe" asistencia a fechas anteriores a su alta.
                  const eligibleMeetings = meetings.filter((m) => wasMemberAtMeeting(member.joinedAt, m.date))
                  const presentCount = eligibleMeetings.filter((m) => statusAt(m.id, member.userId) === 'Presente').length
                  return (
                    <tr key={member.id} className="hover:bg-sel-lavender/5 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {member.user.image ? (
                            <img src={member.user.image} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-sel-lavender/30 dark:bg-zinc-700 flex items-center justify-center text-sel-purple dark:text-white text-[10px] font-bold shrink-0">
                              {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-sel-body dark:text-zinc-200">
                            {member.user.firstName} {member.user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-sm font-semibold text-sel-purple dark:text-white border-l border-sel-lavender/20 dark:border-zinc-800">
                        {presentCount}/{eligibleMeetings.length}
                      </td>
                      {meetings.map((m) => {
                        const wasMember = wasMemberAtMeeting(member.joinedAt, m.date)
                        const status = wasMember ? statusAt(m.id, member.userId) : null
                        const cfg = statusConfig(status)
                        return (
                          <td key={m.id} className="px-2 py-2.5 text-center border-l border-sel-lavender/20 dark:border-zinc-800">
                            {!wasMember ? (
                              <span className="inline-flex w-6 h-6" title="Todavía no era parte del grupo" />
                            ) : cfg ? (
                              <span className={`inline-flex w-6 h-6 rounded-md items-center justify-center ${cfg.solid}`} title={cfg.label}>
                                <cfg.icon className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex w-6 h-6 items-center justify-center text-sel-body/20 dark:text-zinc-700" title="Sin marcar">
                                —
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
