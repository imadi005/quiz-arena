import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

// Shown only after Cognito's NEW_PASSWORD_REQUIRED challenge fires (initial password already
// validated during login). No "current password" field — see spec §4.
export function SetNewPasswordPage() {
  const navigate = useNavigate()
  const { completeNewPassword, requiresNewPassword } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!requiresNewPassword) {
      setError('No pending password challenge — please log in again.')
      return
    }

    setIsSubmitting(true)
    try {
      const role = await completeNewPassword(newPassword)
      navigate(role === 'ADMIN' || role === 'TEACHER' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set new password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Card className="p-5 sm:p-8">
        <div className="mb-7 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Set your new password</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            You're in. Choose a password only you know.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="At least 8 characters."
          />
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && (
            <p role="alert" className="rounded-lg bg-state-danger/10 px-3 py-2 text-sm text-state-danger">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Set New Password'}
          </Button>
        </form>
      </Card>
    </AuthLayout>
  )
}
