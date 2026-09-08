import { Plus, Play, Pause, Square, Users, Clock } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { mockQuizzes } from '@/data/mockAdmin'
import type { QuizStatus } from '@/types'

const statusTone: Record<QuizStatus, 'answered' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  LIVE: 'answered',
  SCHEDULED: 'info',
  DRAFT: 'neutral',
  PAUSED: 'warning',
  COMPLETED: 'neutral',
  ARCHIVED: 'neutral',
}

export function AdminQuizzesPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Quizzes"
        subtitle={`${mockQuizzes.length} quizzes`}
        action={
          <Button>
            <Plus size={16} /> Create Quiz
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {mockQuizzes.map((q) => (
          <Card key={q.quizId} className="p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <Badge tone={statusTone[q.status]}>{q.status}</Badge>
                <h3 className="mt-2 font-display text-base font-bold text-ink">{q.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{q.description}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-ink-faint">Questions</p>
                <p className="mt-0.5 font-mono-num font-semibold text-ink">{q.questionCount}</p>
              </div>
              <div>
                <p className="text-ink-faint">Duration</p>
                <p className="mt-0.5 font-mono-num font-semibold text-ink">{q.duration}m</p>
              </div>
              <div>
                <p className="text-ink-faint">Malpractice Limit</p>
                <p className="mt-0.5 font-mono-num font-semibold text-ink">{q.malpracticeLimit}</p>
              </div>
            </div>

            {q.status === 'LIVE' && (
              <div className="mb-4 flex items-center gap-4 rounded-lg bg-surface-raised px-3 py-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Users size={13} /> {q.studentsOnline} online
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> avg {q.averageScore}%
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {q.status === 'DRAFT' || q.status === 'SCHEDULED' ? (
                <Button variant="secondary" fullWidth>
                  <Play size={14} /> Start
                </Button>
              ) : q.status === 'LIVE' ? (
                <>
                  <Button variant="secondary" fullWidth>
                    <Pause size={14} /> Pause
                  </Button>
                  <Button variant="danger" fullWidth>
                    <Square size={14} /> End
                  </Button>
                </>
              ) : (
                <Button variant="ghost" fullWidth>
                  View Report
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  )
}
