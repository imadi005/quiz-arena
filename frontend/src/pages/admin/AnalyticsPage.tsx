import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'

const scoreDistribution = [
  { range: '0-10', count: 4 },
  { range: '11-20', count: 18 },
  { range: '21-25', count: 31 },
  { range: '26-30', count: 22 },
]
const maxCount = Math.max(...scoreDistribution.map((d) => d.count))

export function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <PageHeader title="Analytics" subtitle="AWS Cloud Challenge — aggregate results" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Students" value={247} />
        <StatCard label="Completion Rate" value="82%" tone="answered" />
        <StatCard label="Average Score" value="72%" />
        <StatCard label="Malpractice Events" value={19} tone="warning" />
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <h3 className="mb-5 font-display text-sm font-bold text-ink">Score Distribution</h3>
        <div className="space-y-3">
          {scoreDistribution.map((d) => (
            <div key={d.range} className="flex items-center gap-3">
              <span className="w-14 shrink-0 font-mono-num text-xs text-ink-faint">{d.range}</span>
              <div className="h-6 flex-1 overflow-hidden rounded-md bg-surface-raised">
                <div
                  className="h-full rounded-md bg-gradient-to-r from-signal-blue to-signal-violet"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-mono-num text-xs text-ink-muted">
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-4 text-xs text-ink-faint">
        Full analytics (question accuracy, participation, malpractice timeline) arrive in Phase 12.
      </p>
    </AdminLayout>
  )
}
