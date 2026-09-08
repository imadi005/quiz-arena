import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockLiveStudents } from '@/data/mockAdmin'
import type { LiveStudentStatus } from '@/types'

const statusConfig: Record<LiveStudentStatus, { tone: 'answered' | 'warning' | 'danger' | 'neutral'; label: string; dot: string }> = {
  NORMAL: { tone: 'answered', label: 'Normal', dot: 'bg-state-answered' },
  WARNING: { tone: 'warning', label: 'Warning', dot: 'bg-state-warning' },
  CRITICAL: { tone: 'danger', label: 'Critical', dot: 'bg-state-danger' },
  TERMINATED: { tone: 'neutral', label: 'Terminated', dot: 'bg-state-neutral' },
}

export function AdminLiveMonitorPage() {
  const counts = mockLiveStudents.reduce(
    (acc, s) => {
      acc[s.status]++
      return acc
    },
    { NORMAL: 0, WARNING: 0, CRITICAL: 0, TERMINATED: 0 } as Record<LiveStudentStatus, number>,
  )

  return (
    <AdminLayout>
      <PageHeader
        title="Live Monitor"
        subtitle="AWS Cloud Challenge — updates in real time once WebSockets are wired in Phase 9"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(statusConfig) as LiveStudentStatus[]).map((s) => (
          <Card key={s} className="p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${statusConfig[s].dot}`} />
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {statusConfig[s].label}
              </p>
            </div>
            <p className="mt-2 font-mono-num text-2xl font-bold text-ink">{counts[s]}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wider text-ink-faint">
                <th className="py-2.5 pr-4 font-semibold">Student</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 pr-4 font-semibold">Violations</th>
                <th className="py-2.5 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {mockLiveStudents.map((s) => (
                <tr key={s.rollNumber} className="border-b border-border-subtle/60 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="text-ink">{s.name}</p>
                    <p className="font-mono-num text-xs text-ink-faint">{s.rollNumber}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusConfig[s.status].tone}>{statusConfig[s.status].label}</Badge>
                  </td>
                  <td className="py-3 pr-4 font-mono-num text-ink">
                    {s.violations}/{s.malpracticeLimit}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-raised">
                        <div
                          className="h-full rounded-full bg-signal-blue"
                          style={{ width: `${(s.currentQuestion / s.totalQuestions) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono-num text-xs text-ink-faint">
                        Q{s.currentQuestion}/{s.totalQuestions}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  )
}
