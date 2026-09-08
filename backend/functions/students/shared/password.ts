// Generates a temporary password meeting the pool's policy (8+ chars, upper+lower+digit —
// see infrastructure/lib/auth-stack.ts passwordPolicy). Admin sees this once in the API
// response to hand to the student; it is never stored anywhere by us — Cognito owns it.
export function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no I/O — avoids visual confusion
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]

  const required = [pick(upper), pick(lower), pick(digits), pick(digits)]
  const rest = Array.from({ length: 6 }, () => pick(upper + lower + digits))
  const all = [...required, ...rest]

  // shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all.join('')
}
