import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { quizApi, type LeaderboardRow } from '@/services/quizApi'

const medal = ['🥇', '🥈', '🥉']

export function AdminLeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [liveTitle, setLiveTitle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      quizApi
        .getQuizStatus()
        .then((status) => {
          if (!cancelled) setLiveTitle(status.live ? status.title : null)
        })
        .catch(() => {})
      quizApi
        .getLeaderboard()
        .then((data) => {
          if (!cancelled) {
            setRows(data)
            setError(null)
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load leaderboard.')
        })
    }
    load()
    const interval = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <AdminLayout>
      <PageHeader title="Live Top 10" subtitle={liveTitle ?? 'No quiz is live right now'} />

      <Card className="p-4 sm:p-5">
        {error && <p className="mb-3 text-sm text-state-danger">{error}</p>}
        {rows.length === 0 && !error ? (
          <p className="p-4 text-sm text-ink-faint">No submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.slice(0, 10).map((entry) => (
              <div
                key={entry.rollNumber}
                className={[
                  'flex items-center justify-between rounded-xl px-4 py-3',
                  entry.rank <= 3 ? 'bg-surface-raised' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center font-display text-sm font-bold text-ink-faint">
                    {entry.rank <= 3 ? medal[entry.rank - 1] : entry.rank}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{entry.name}</p>
                    <p className="font-mono-num text-xs text-ink-faint">{entry.rollNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono-num text-sm font-bold text-ink">
                    {entry.score}/{entry.totalMarks}
                  </p>
                  <p className="font-mono-num text-xs text-ink-faint">{entry.accuracy}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-faint">
        <Trophy size={13} /> Ranking: best score → earliest submission. Refreshes every 5s.
      </p>
    </AdminLayout>
  )
}
