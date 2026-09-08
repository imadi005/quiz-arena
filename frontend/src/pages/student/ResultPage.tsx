import { useLocation, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ResultState {
  rollNumber: string
  score: number | null
  totalMarks: number
  attemptsUsed: number
  attemptsRemaining: number
  locked?: boolean
  autoEnded?: boolean
}

export function ResultPage() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: ResultState | null }

  if (!state) {
    navigate('/login', { replace: true })
    return null
  }

  const { rollNumber, score, totalMarks, attemptsUsed, attemptsRemaining, locked, autoEnded } = state
  const accuracy = totalMarks && score !== null ? Math.round((score / totalMarks) * 1000) / 10 : null

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <Card className="p-10 text-center">
        <h1 className="font-display text-xl font-bold text-ink">
          {locked ? 'No attempts remaining' : 'Test submitted'}
        </h1>
        <p className="mt-1.5 font-mono-num text-sm text-ink-faint">{rollNumber}</p>
        {autoEnded && (
          <p className="mt-3 rounded-lg bg-signal-blue/10 px-3 py-2 text-xs text-signal-blue">
            The admin ended this quiz — your answers were submitted automatically.
          </p>
        )}

        <div className="mt-8">
          <p className="font-mono-num text-4xl font-bold text-ink">
            {score ?? '—'}
            <span className="text-xl text-ink-faint"> / {totalMarks}</span>
          </p>
          {accuracy !== null && <p className="mt-1 text-sm text-ink-muted">{accuracy}% accuracy</p>}
        </div>

        <p className="mt-6 text-xs text-ink-faint">
          Attempt {attemptsUsed} of 3 used · {attemptsRemaining} remaining
        </p>

        <Button
          className="mt-8"
          fullWidth
          onClick={() => {
            sessionStorage.removeItem('quizRollNumber')
            navigate('/login')
          }}
        >
          Done
        </Button>
      </Card>
    </div>
  )
}
