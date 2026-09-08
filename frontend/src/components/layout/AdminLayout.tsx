import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  ClipboardList,
  Radio,
  Trophy,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { to: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList },
  { to: '/admin/live-monitor', label: 'Live Monitor', icon: Radio },
  { to: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-void">
      {/* Sidebar — desktop */}
      <aside className="hidden w-60 shrink-0 border-r border-border-subtle bg-surface lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-signal-blue to-signal-violet font-display text-sm font-bold text-white">
            Q
          </span>
          <span className="font-display text-base font-bold tracking-tight text-ink">
            Quiz Arena
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-signal-blue/15 text-signal-blue'
                    : 'text-ink-muted hover:bg-surface-raised hover:text-ink',
                ].join(' ')
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border-subtle px-4 py-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-surface-raised px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-violet/20 font-display text-xs font-bold text-signal-violet">
              A
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">Admin</p>
              <p className="truncate text-xs text-ink-faint">admin@college.edu</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center gap-2 overflow-x-auto border-b border-border-subtle bg-surface/95 px-3 py-2 backdrop-blur lg:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-signal-blue/15 text-signal-blue'
                  : 'text-ink-muted hover:text-ink',
              ].join(' ')
            }
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>

      <main className="min-w-0 flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
