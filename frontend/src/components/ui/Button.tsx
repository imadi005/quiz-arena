import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-signal-blue to-signal-violet text-white shadow-[0_0_0_1px_rgba(76,111,255,0.3),0_8px_24px_-8px_rgba(76,111,255,0.6)] hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface-raised text-ink border border-border-subtle hover:border-signal-blue/60 hover:bg-surface',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-raised',
  danger: 'bg-state-danger text-white hover:brightness-110',
}

export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5',
        'font-display text-sm font-semibold tracking-wide',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-blue focus-visible:ring-offset-2 focus-visible:ring-offset-void',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        fullWidth ? 'w-full' : '',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
