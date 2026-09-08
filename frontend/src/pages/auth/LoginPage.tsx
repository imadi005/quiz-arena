import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { quizApi } from '@/services/quizApi'

type Mode = 'student' | 'admin'

export function LoginPage() {
  const navigate = useNavigate()
  const { loginWithUsername, isCognitoConfigured, unlockLocalAdmin } = useAuth()
  const [mode, setMode] = useState<Mode>('student')

  const [rollNumber, setRollNumber] = useState('')

  const [email, setEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStudentStart = async () => {
    const rn = rollNumber.trim().toUpperCase()
    if (!rn) {
      setError('Enter your roll number to begin.')
      return
    }

    setIsSubmitting(true)
    try {
      const status = await quizApi.getAttemptStatus(rn)
      if (status.attemptsRemaining <= 0) {
        navigate('/result', {
          state: {
            rollNumber: rn,
            score: status.bestScore,
            totalMarks: status.totalMarks,
            attemptsUsed: status.attemptsUsed,
            attemptsRemaining: 0,
            locked: true,
          },
        })
        return
      }
      sessionStorage.setItem('quizRollNumber', rn)
      navigate('/sample')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the test. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAdminLogin = async () => {
    const username = email.trim()
    const password = adminPassword

    if (!username || !password) {
      setError('Enter your admin email and password to continue.')
      return
    }

    // Classroom-without-internet fallback: a local passcode unlocks admin
    // routes with no network call at all.
    if (unlockLocalAdmin(username, password)) {
      navigate('/admin')
      return
    }

    if (!isCognitoConfigured) {
      setError(
        'That passcode is wrong, and Cognito is not configured in this environment ' +
          '(VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID missing).',
      )
      return
    }

    setIsSubmitting(true)
    try {
      const result = await loginWithUsername(username, password)
      if (result.requiresNewPassword) {
        navigate('/set-password')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'student') {
      handleStudentStart()
    } else {
      handleAdminLogin()
    }
  }

  return (
    <AuthLayout>
      <Card className="p-5 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">
            {mode === 'student' ? 'Ready for the challenge?' : 'Admin sign in'}
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {mode === 'student'
              ? 'Enter your roll number to start the test.'
              : 'Sign in with your admin email.'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Login as"
          className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-surface-raised p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'student'}
            onClick={() => {
              setMode('student')
              setError(null)
            }}
            className={[
              'rounded-md py-2 font-display text-sm font-semibold transition-colors',
              mode === 'student' ? 'bg-signal-blue text-white' : 'text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            Student
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'admin'}
            onClick={() => {
              setMode('admin')
              setError(null)
            }}
            className={[
              'rounded-md py-2 font-display text-sm font-semibold transition-colors',
              mode === 'admin' ? 'bg-signal-blue text-white' : 'text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {mode === 'student' ? (
            <Input
              label="Roll Number"
              placeholder="KJ23MCA001"
              autoComplete="username"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
            />
          ) : (
            <>
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@college.edu"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? (mode === 'student' ? 'Checking…' : 'Signing in…') : mode === 'student' ? 'Start Test' : 'Login'}
          </Button>
        </form>

        {mode === 'student' && (
          <p className="mt-6 text-center text-xs text-ink-faint">
            No password needed — just your roll number. You get 3 attempts; your best score counts.
          </p>
        )}
      </Card>
    </AuthLayout>
  )
}
