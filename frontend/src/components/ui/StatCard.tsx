import type { ReactNode } from 'react'
import { Card } from './Card'

export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string
  value: string | number
  icon?: ReactNode
  tone?: 'default' | 'answered' | 'warning' | 'danger'
}) {
  const toneText = {
    default: 'text-ink',
    answered: 'text-state-answered',
    warning: 'text-state-warning',
    danger: 'text-state-danger',
  }[tone]

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
        {icon && <span className="text-ink-faint">{icon}</span>}
      </div>
      <p className={`mt-2 font-mono-num text-2xl font-bold ${toneText}`}>{value}</p>
    </Card>
  )
}
