import type { ReactNode } from 'react'

type Tone = 'answered' | 'warning' | 'danger' | 'review' | 'neutral' | 'info'

interface BadgeProps {
  tone: Tone
  icon?: ReactNode
  children: ReactNode
}

const toneClasses: Record<Tone, string> = {
  answered: 'bg-state-answered/15 text-state-answered border-state-answered/30',
  warning: 'bg-state-warning/15 text-state-warning border-state-warning/30',
  danger: 'bg-state-danger/15 text-state-danger border-state-danger/30',
  review: 'bg-state-review/15 text-state-review border-state-review/30',
  neutral: 'bg-state-neutral/15 text-ink-muted border-state-neutral/30',
  info: 'bg-signal-blue/15 text-signal-blue border-signal-blue/30',
}

// Always renders text alongside color+icon — never color-only,
// per the platform's accessibility requirement for exam states.
export function Badge({ tone, icon, children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
        'font-display text-xs font-semibold',
        toneClasses[tone],
      ].join(' ')}
    >
      {icon}
      {children}
    </span>
  )
}
