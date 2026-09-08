import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { quizApi, type AdminQuestion } from '@/services/quizApi'
import type { Difficulty } from '@/types'

const difficultyTone: Record<Difficulty, 'answered' | 'warning' | 'danger'> = {
  Easy: 'answered',
  Medium: 'warning',
  Hard: 'danger',
}

const emptyForm = {
  questionText: '',
  options: ['', '', '', ''] as [string, string, string, string],
  correctAnswer: 0 as 0 | 1 | 2 | 3,
  marks: 1,
  difficulty: 'Medium' as Difficulty,
  category: 'General',
}

export function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [category, setCategory] = useState('All')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    quizApi
      .getAdminQuestions()
      .then((qs) => {
        setQuestions(qs)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load questions.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const categories = ['All', ...new Set(questions.map((q) => q.category))]
  const filtered = category === 'All' ? questions : questions.filter((q) => q.category === category)

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.questionText.trim() || form.options.some((o) => !o.trim())) {
      setError('Fill in the question text and all 4 options.')
      return
    }
    setSaving(true)
    try {
      await quizApi.addAdminQuestion(form)
      setForm(emptyForm)
      setShowModal(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add question.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (questionId: string) => {
    try {
      await quizApi.deleteAdminQuestion(questionId)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete question.')
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Question Bank"
        subtitle={loading ? 'Loading…' : `${questions.length} questions across ${categories.length - 1} categories`}
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Question
          </Button>
        }
      />

      {error && <p className="mb-4 text-sm text-state-danger">{error}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={[
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              category === c
                ? 'bg-signal-blue/15 text-signal-blue'
                : 'bg-surface-raised text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((q) => (
          <Card key={q.questionId} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone={difficultyTone[q.difficulty as Difficulty]}>{q.difficulty}</Badge>
                  <Badge tone="info">{q.category}</Badge>
                  <span className="text-xs text-ink-faint">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                </div>
                <p className="font-medium text-ink">{q.questionText}</p>
                <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={[
                        'rounded-lg border px-3 py-1.5 text-sm',
                        i === q.correctAnswer
                          ? 'border-state-answered/40 bg-state-answered/10 text-state-answered'
                          : 'border-border-subtle text-ink-muted',
                      ].join(' ')}
                    >
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => handleDelete(q.questionId)}
                  className="rounded-lg p-2 text-ink-faint hover:bg-state-danger/10 hover:text-state-danger"
                  aria-label="Delete question"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="p-4 text-sm text-ink-faint">No questions yet — add one to get started.</p>
        )}
      </div>

      {showModal && (
        <Modal title="Add Question" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input
              label="Question Text"
              value={form.questionText}
              onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
            />
            {form.options.map((opt, i) => (
              <Input
                key={i}
                label={`Option ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChange={(e) =>
                  setForm((f) => {
                    const options = [...f.options] as [string, string, string, string]
                    options[i] = e.target.value
                    return { ...f, options }
                  })
                }
              />
            ))}
            <div>
              <label className="mb-1.5 block font-display text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Correct Answer
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, correctAnswer: i as 0 | 1 | 2 | 3 }))}
                    className={[
                      'rounded-lg border py-2 text-sm font-semibold',
                      form.correctAnswer === i
                        ? 'border-signal-blue bg-signal-blue/10 text-signal-blue'
                        : 'border-border-subtle text-ink-muted',
                    ].join(' ')}
                  >
                    {String.fromCharCode(65 + i)}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
            <Button type="submit" fullWidth disabled={saving}>
              {saving ? 'Adding…' : 'Add Question'}
            </Button>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
