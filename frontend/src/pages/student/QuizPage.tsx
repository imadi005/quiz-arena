import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { quizApi, type PublicQuestion } from '@/services/quizApi'

const DEFAULT_DURATION_SECONDS = 10 * 60

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function QuizPage() {
  const navigate = useNavigate()
  const rollNumber = sessionStorage.getItem('quizRollNumber')
  const quizId = sessionStorage.getItem('quizId')
  const durationMinutes = Number(sessionStorage.getItem('quizDuration'))
  const durationSeconds = durationMinutes > 0 ? durationMinutes * 60 : DEFAULT_DURATION_SECONDS

  const [questions, setQuestions] = useState<PublicQuestion[] | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [current, setCurrent] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Avoids the submit-on-timeout closure capturing stale state.
  const answersRef = useRef(answers)
  answersRef.current = answers
  const questionsRef = useRef(questions)
  questionsRef.current = questions
  const submittingRef = useRef(submitting)
  submittingRef.current = submitting

  useEffect(() => {
    if (!rollNumber || !quizId) {
      navigate('/login', { replace: true })
      return
    }
    quizApi
      .getQuestions()
      .then((qs) => {
        if (qs.length === 0) {
          setError('No questions have been added yet. Ask your admin to add questions.')
          return
        }
        setQuestions(qs)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load questions.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer)
          if (!submittingRef.current) void handleSubmit()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async () => {
    const qs = questionsRef.current
    if (!rollNumber || !quizId || !qs || submittingRef.current) return
    setSubmitting(true)
    setError(null)
    try {
      const orderedAnswers = qs.map((_, i) => answersRef.current[i] ?? -1)
      const result = await quizApi.submit(quizId, rollNumber, rollNumber, orderedAnswers)
      sessionStorage.removeItem('quizRollNumber')
      sessionStorage.removeItem('quizId')
      sessionStorage.removeItem('quizDuration')
      navigate('/result', { state: { rollNumber, ...result } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit. Try again.')
      setSubmitting(false)
    }
  }

  if (error && !questions) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <Card className="p-8 text-center">
          <p className="text-sm text-state-danger">{error}</p>
          <Button className="mt-6" onClick={() => navigate('/login')}>
            Back
          </Button>
        </Card>
      </div>
    )
  }

  if (!questions) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center text-sm text-ink-muted">
        Loading questions…
      </div>
    )
  }

  const q = questions[current]
  const answeredCount = Object.keys(answers).length

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono-num text-sm text-ink-faint">
          {rollNumber} · Question {current + 1} / {questions.length}
        </p>
        <p
          className={[
            'font-mono-num text-sm font-bold',
            secondsLeft <= 60 ? 'text-state-danger' : 'text-ink',
          ].join(' ')}
        >
          {formatTime(secondsLeft)}
        </p>
      </div>

      <Card className="p-6">
        <p className="mb-5 font-medium text-ink">{q.questionText}</p>
        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [current]: i }))}
              className={[
                'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                answers[current] === i
                  ? 'border-signal-blue bg-signal-blue/10 text-ink'
                  : 'border-border-subtle text-ink-muted hover:border-signal-blue/40',
              ].join(' ')}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          disabled={current === 0}
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          Previous
        </Button>

        <p className="font-mono-num text-xs text-ink-faint">{answeredCount} / {questions.length} answered</p>

        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
            Next
          </Button>
        ) : (
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Test'}
          </Button>
        )}
      </div>
    </div>
  )
}
