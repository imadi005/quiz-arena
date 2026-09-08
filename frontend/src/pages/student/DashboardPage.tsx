import { Card } from '@/components/ui/Card'

// Placeholder — full dashboard (stats, available quizzes, achievements)
// is built in Phase 3+ once student management & quizzes exist.
export function StudentDashboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Card className="p-10 text-center">
        <h1 className="font-display text-xl font-bold text-ink">Student Dashboard</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Arrives in a later phase, once student accounts and quizzes exist.
        </p>
      </Card>
    </div>
  )
}
