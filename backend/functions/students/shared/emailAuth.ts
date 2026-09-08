// Simple version for Phase 3: allowed domains come from an env var set at deploy time
// (ALLOWED_EMAIL_DOMAINS, comma-separated, e.g. "college.edu,kristujayanti.edu.in").
// TODO (not yet built): an admin UI to edit this at runtime instead of via redeploy —
// tracked in TODO_IMPLEMENTATION.md. Individual-email allowlisting (spec §5 option B) is
// also not yet built; this only covers domain-based authorization (option A).
export function isEmailAuthorized(email: string): boolean {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS ?? ''
  const domains = raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  if (domains.length === 0) return true // no restriction configured yet

  const emailDomain = email.split('@')[1]?.toLowerCase()
  return domains.includes(emailDomain ?? '')
}
