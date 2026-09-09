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

function shuffledIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function isValidPermutation(value: unknown, length: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    new Set(value).size === length &&
    value.every((n) => Number.isInteger(n) && n >= 0 && n < length)
  )
}

export function QuizPage() {
  const navigate = useNavigate()
  const rollNumber = sessionStorage.getItem('quizRollNumber')
  const name = sessionStorage.getItem('quizName') ?? rollNumber ?? ''
  const quizId = sessionStorage.getItem('quizId')
  const durationMinutes = Number(sessionStorage.getItem('quizDuration'))
  const durationSeconds = durationMinutes > 0 ? durationMinutes * 60 : DEFAULT_DURATION_SECONDS

  // Survive a page refresh mid-test: the timer is anchored to an absolute end
  // time (not a countdown that resets to full duration on reload), and answers
  // / current question are restored from sessionStorage instead of starting over.
  const endAt = (() => {
    const stored = Number(sessionStorage.getItem('quizEndAt'))
    if (stored > Date.now()) return stored
    const fresh = Date.now() + durationSeconds * 1000
    sessionStorage.setItem('quizEndAt', String(fresh))
    return fresh
  })()

  const [questions, setQuestions] = useState<PublicQuestion[] | null>(null)
  // order[displayPosition] = original question index. optionOrder[originalQuestionIndex]
  // = original option indices in the order they're displayed. Both are shuffled per
  // student and persisted so a refresh doesn't reshuffle mid-test.
  const [order, setOrder] = useState<number[] | null>(null)
  const [optionOrder, setOptionOrder] = useState<Record<number, number[]> | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('quizAnswers') ?? '{}')
    } catch {
      return {}
    }
  })
  const [current, setCurrent] = useState(() => Number(sessionStorage.getItem('quizCurrent')) || 0)
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.round((endAt - Date.now()) / 1000)))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    sessionStorage.setItem('quizAnswers', JSON.stringify(answers))
  }, [answers])

  useEffect(() => {
    sessionStorage.setItem('quizCurrent', String(current))
  }, [current])

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

        let questionOrder: number[]
        try {
          const stored = JSON.parse(sessionStorage.getItem('quizOrder') ?? 'null')
          questionOrder = isValidPermutation(stored, qs.length) ? stored : shuffledIndices(qs.length)
        } catch {
          questionOrder = shuffledIndices(qs.length)
        }
        sessionStorage.setItem('quizOrder', JSON.stringify(questionOrder))
        setOrder(questionOrder)

        let perQuestionOptionOrder: Record<number, number[]>
        try {
          const stored = JSON.parse(sessionStorage.getItem('quizOptionOrder') ?? 'null')
          const valid =
            stored &&
            typeof stored === 'object' &&
            qs.every((q, i) => isValidPermutation(stored[i], q.options.length))
          perQuestionOptionOrder = valid ? stored : Object.fromEntries(qs.map((q, i) => [i, shuffledIndices(q.options.length)]))
        } catch {
          perQuestionOptionOrder = Object.fromEntries(qs.map((q, i) => [i, shuffledIndices(q.options.length)]))
        }
        sessionStorage.setItem('quizOptionOrder', JSON.stringify(perQuestionOptionOrder))
        setOptionOrder(perQuestionOptionOrder)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load questions.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(timer)
        if (!submittingRef.current) void handleSubmit(false)
      }
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If the admin pauses or ends this quiz while a student is mid-test, don't leave
  // them stuck on a blocking error — submit whatever they have automatically.
  useEffect(() => {
    if (!quizId) return
    const poll = setInterval(() => {
      quizApi
        .getQuizStatus()
        .then((status) => {
          const stillLive = status.live && status.quizId === quizId
          if (!stillLive && !submittingRef.current) void handleSubmit(true)
        })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(poll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (autoEnded: boolean) => {
    const qs = questionsRef.current
    if (!rollNumber || !quizId || !qs || submittingRef.current) return
    setSubmitting(true)
    setError(null)
    try {
      const orderedAnswers = qs.map((_, i) => answersRef.current[i] ?? -1)
      const result = await quizApi.submit(quizId, rollNumber, name, orderedAnswers)
      sessionStorage.removeItem('quizRollNumber')
      sessionStorage.removeItem('quizName')
      sessionStorage.removeItem('quizId')
      sessionStorage.removeItem('quizDuration')
      sessionStorage.removeItem('quizEndAt')
      sessionStorage.removeItem('quizAnswers')
      sessionStorage.removeItem('quizCurrent')
      sessionStorage.removeItem('quizOrder')
      sessionStorage.removeItem('quizOptionOrder')
      navigate('/result', { state: { rollNumber, name, autoEnded, ...result } })
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

  if (!questions || !order || !optionOrder) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center text-sm text-ink-muted">
        Loading questions…
      </div>
    )
  }

  const origIdx = order[current]
  const q = questions[origIdx]
  const displayOptionOrder = optionOrder[origIdx]
  const answeredCount = Object.keys(answers).length

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono-num text-sm text-ink-faint">
          {name} ({rollNumber}) · Question {current + 1} / {questions.length}
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
          {displayOptionOrder.map((actualOptionIndex, displayPos) => (
            <button
              key={actualOptionIndex}
              type="button"
              onClick={() => setAnswers((a) => ({ ...a, [origIdx]: actualOptionIndex }))}
              className={[
                'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                answers[origIdx] === actualOptionIndex
                  ? 'border-signal-blue bg-signal-blue/10 text-ink'
                  : 'border-border-subtle text-ink-muted hover:border-signal-blue/40',
              ].join(' ')}
            >
              {String.fromCharCode(65 + displayPos)}. {q.options[actualOptionIndex]}
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
          <Button onClick={() => void handleSubmit(false)} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Test'}
          </Button>
        )}
      </div>
    </div>
  )
}
