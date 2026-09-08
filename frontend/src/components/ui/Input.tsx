import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="mb-1.5 block font-display text-xs font-semibold uppercase tracking-wider text-ink-muted"
        >
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={[
            'w-full rounded-lg border bg-surface px-4 py-2.5 text-ink placeholder:text-ink-faint',
            'font-mono-num text-sm tracking-wide',
            'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-signal-blue/60',
            error ? 'border-state-danger' : 'border-border-subtle focus:border-signal-blue',
            className,
          ].join(' ')}
          {...rest}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-state-danger">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-faint">
            {hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
