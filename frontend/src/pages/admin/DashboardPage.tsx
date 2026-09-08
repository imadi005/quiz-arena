import { Users, ClipboardCheck, ShieldAlert, TrendingUp } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockQuizzes } from '@/data/mockAdmin'

export function AdminDashboardPage() {
  const liveQuiz = mockQuizzes.find((q) => q.status === 'LIVE')

  return (
    <AdminLayout>
      <PageHeader
        title="Command Center"
        subtitle="Everything happening across Quiz Arena right now."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Students" value={247} icon={<Users size={16} />} />
        <StatCard label="Quizzes Live" value={mockQuizzes.filter((q) => q.status === 'LIVE').length} icon={<TrendingUp size={16} />} tone="answered" />
        <StatCard label="Completed Today" value={31} icon={<ClipboardCheck size={16} />} />
        <StatCard label="Malpractice Events" value={19} icon={<ShieldAlert size={16} />} tone="warning" />
      </div>

      {liveQuiz && (
        <Card className="mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Badge tone="answered" icon={<span className="h-1.5 w-1.5 rounded-full bg-state-answered" />}>
                  LIVE
                </Badge>
                <h2 className="font-display text-lg font-bold text-ink">{liveQuiz.title}</h2>
              </div>
              <p className="text-sm text-ink-muted">{liveQuiz.description}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-ink-faint">Students Online</p>
              <p className="font-mono-num text-xl font-bold text-ink">{liveQuiz.studentsOnline}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">Completed</p>
              <p className="font-mono-num text-xl font-bold text-ink">{liveQuiz.completed}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">Avg. Score</p>
              <p className="font-mono-num text-xl font-bold text-ink">{liveQuiz.averageScore}%</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">Duration</p>
              <p className="font-mono-num text-xl font-bold text-ink">{liveQuiz.duration}m</p>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h3 className="mb-4 font-display text-sm font-bold text-ink">Quiz Status Overview</h3>
          <div className="space-y-3">
            {mockQuizzes.map((q) => (
              <div key={q.quizId} className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{q.title}</span>
                <Badge
                  tone={
                    q.status === 'LIVE'
                      ? 'answered'
                      : q.status === 'SCHEDULED'
                        ? 'info'
                        : q.status === 'COMPLETED'
                          ? 'neutral'
                          : 'warning'
                  }
                >
                  {q.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="mb-4 font-display text-sm font-bold text-ink">Recent Activity</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between text-ink-muted">
              <span>Priya Sharma flagged for tab switch</span>
              <span className="font-mono-num text-xs text-ink-faint">2m ago</span>
            </li>
            <li className="flex justify-between text-ink-muted">
              <span>Rahul Singh submitted AWS Cloud Challenge</span>
              <span className="font-mono-num text-xs text-ink-faint">6m ago</span>
            </li>
            <li className="flex justify-between text-ink-muted">
              <span>Admin created quiz "Linux Essentials"</span>
              <span className="font-mono-num text-xs text-ink-faint">1h ago</span>
            </li>
            <li className="flex justify-between text-ink-muted">
              <span>25 students imported via CSV</span>
              <span className="font-mono-num text-xs text-ink-faint">3h ago</span>
            </li>
          </ul>
        </Card>
      </div>
    </AdminLayout>
  )
}
