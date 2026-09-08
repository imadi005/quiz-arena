import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-border-subtle bg-surface',
        'shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
