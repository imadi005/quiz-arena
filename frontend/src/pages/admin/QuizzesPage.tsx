import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Play, Pause, Square, Users, Clock, Trash2, TimerReset } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { quizApi, type AdminQuiz, type QuizStatusValue } from '@/services/quizApi'

const statusTone: Record<QuizStatusValue, 'answered' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  LIVE: 'answered',
  SCHEDULED: 'info',
  DRAFT: 'neutral',
  PAUSED: 'warning',
  COMPLETED: 'neutral',
}

const emptyForm = { title: '', description: '', duration: 10 }

export function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busyQuizId, setBusyQuizId] = useState<string | null>(null)

  const load = () => {
    quizApi
      .getAdminQuizzes()
      .then((qs) => {
        setQuizzes(qs)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load quizzes.'))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Give the quiz a title.')
      return
    }
    setSaving(true)
    try {
      await quizApi.createAdminQuiz(form)
      setForm(emptyForm)
      setShowModal(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create quiz.')
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (quizId: string, action: 'start' | 'pause' | 'end') => {
    setBusyQuizId(quizId)
    try {
      await quizApi.patchAdminQuiz(quizId, action)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update quiz.')
    } finally {
      setBusyQuizId(null)
    }
  }

  const handleExtend = async (quizId: string, currentDuration: number, minutes: number) => {
    setBusyQuizId(quizId)
    try {
      await quizApi.updateAdminQuizDuration(quizId, Math.max(1, currentDuration + minutes))
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update duration.')
    } finally {
      setBusyQuizId(null)
    }
  }

  const handleDelete = async (quizId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This also deletes its attempts and leaderboard data.`)) return
    setBusyQuizId(quizId)
    try {
      await quizApi.deleteAdminQuiz(quizId)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete quiz.')
    } finally {
      setBusyQuizId(null)
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Quizzes"
        subtitle={`${quizzes.length} quiz${quizzes.length === 1 ? '' : 'zes'}`}
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Quiz
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-state-danger">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {quizzes.map((q) => (
          <Card key={q.quizId} className="p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <Badge tone={statusTone[q.status]}>{q.status}</Badge>
                <h3 className="mt-2 font-display text-base font-bold text-ink">{q.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{q.description}</p>
              </div>
              <button
                onClick={() => handleDelete(q.quizId, q.title)}
                disabled={busyQuizId === q.quizId}
                className="shrink-0 rounded-lg p-2 text-ink-faint hover:bg-state-danger/10 hover:text-state-danger"
                aria-label="Delete quiz"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-ink-faint">Questions</p>
                <p className="mt-0.5 font-mono-num font-semibold text-ink">{q.questionCount}</p>
              </div>
              <div>
                <p className="text-ink-faint">Duration</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="font-mono-num font-semibold text-ink">{q.duration}m</p>
                  {q.status !== 'COMPLETED' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExtend(q.quizId, q.duration, -5)}
                        disabled={busyQuizId === q.quizId || q.duration <= 5}
                        aria-label="Decrease duration by 5 minutes"
                        className="rounded px-1.5 py-0.5 text-xs font-semibold text-ink-faint hover:bg-surface-raised hover:text-ink disabled:opacity-30"
                      >
                        −5
                      </button>
                      <button
                        onClick={() => handleExtend(q.quizId, q.duration, 5)}
                        disabled={busyQuizId === q.quizId}
                        aria-label="Increase duration by 5 minutes"
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold text-signal-blue hover:bg-signal-blue/10"
                      >
                        <TimerReset size={11} /> +5
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {q.status === 'LIVE' && (
              <p className="mb-3 text-[11px] text-ink-faint">
                +5/−5 changes reach students already taking this quiz within 5 seconds.
              </p>
            )}

            {(q.status === 'LIVE' || q.status === 'PAUSED' || q.status === 'COMPLETED') && (
              <div className="mb-4 flex items-center gap-4 rounded-lg bg-surface-raised px-3 py-2 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <Users size={13} /> {q.studentsOnline} completed
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> avg {q.averageScore}%
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {q.status === 'DRAFT' || q.status === 'SCHEDULED' || q.status === 'PAUSED' ? (
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={busyQuizId === q.quizId}
                  onClick={() => handleAction(q.quizId, 'start')}
                >
                  <Play size={14} /> Start
                </Button>
              ) : q.status === 'LIVE' ? (
                <>
                  <Button
                    variant="secondary"
                    fullWidth
                    disabled={busyQuizId === q.quizId}
                    onClick={() => handleAction(q.quizId, 'pause')}
                  >
                    <Pause size={14} /> Pause
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    disabled={busyQuizId === q.quizId}
                    onClick={() => handleAction(q.quizId, 'end')}
                  >
                    <Square size={14} /> End
                  </Button>
                </>
              ) : (
                <Button variant="ghost" fullWidth disabled>
                  Completed
                </Button>
              )}
            </div>
          </Card>
        ))}
        {quizzes.length === 0 && !error && (
          <p className="p-4 text-sm text-ink-faint">No quizzes yet — create one to get started.</p>
        )}
      </div>

      {showModal && (
        <Modal title="Create Quiz" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
            />
            <Button type="submit" fullWidth disabled={saving}>
              {saving ? 'Creating…' : 'Create Quiz'}
            </Button>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
