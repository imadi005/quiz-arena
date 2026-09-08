import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-void px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative w-full max-w-md">
        <div className="arena-grid pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-signal-blue/20 blur-3xl sm:h-80 sm:w-80" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-signal-violet/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-8 flex items-center justify-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-signal-blue to-signal-violet font-display text-lg font-bold text-white">
              Q
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Quiz Arena
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
