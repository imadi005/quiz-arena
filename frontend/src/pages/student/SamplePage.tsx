import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SAMPLE_QUESTION = {
  questionText: 'This is a practice question so you know how the real test works. Which planet is known as the Red Planet?',
  options: ['Earth', 'Mars', 'Venus', 'Jupiter'],
  correctAnswer: 1,
}

export function SamplePage() {
  const navigate = useNavigate()
  const rollNumber = sessionStorage.getItem('quizRollNumber')
  const [selected, setSelected] = useState<number | null>(null)

  if (!rollNumber) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono-num text-sm text-ink-faint">{rollNumber} · Practice question</p>
        <span className="rounded-full bg-signal-blue/15 px-3 py-1 text-xs font-semibold text-signal-blue">
          Not scored
        </span>
      </div>

      <Card className="p-6">
        <p className="mb-5 font-medium text-ink">{SAMPLE_QUESTION.questionText}</p>
        <div className="space-y-2.5">
          {SAMPLE_QUESTION.options.map((opt, i) => {
            const isSelected = selected === i
            const showCorrectness = selected !== null
            const isCorrect = i === SAMPLE_QUESTION.correctAnswer
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(i)}
                className={[
                  'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                  showCorrectness && isCorrect
                    ? 'border-state-answered/60 bg-state-answered/10 text-state-answered'
                    : showCorrectness && isSelected
                      ? 'border-state-danger/60 bg-state-danger/10 text-state-danger'
                      : isSelected
                        ? 'border-signal-blue bg-signal-blue/10 text-ink'
                        : 'border-border-subtle text-ink-muted hover:border-signal-blue/40',
                ].join(' ')}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            )
          })}
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-ink-faint">
        This one doesn't count — it's just so the screen isn't unfamiliar during the real test.
      </p>

      <Button
        className="mt-6"
        fullWidth
        disabled={selected === null}
        onClick={() => navigate('/quiz')}
      >
        Start the Real Test
      </Button>
    </div>
  )
}
