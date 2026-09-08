# Development Log

## Phase 1 — Project Foundation ✅

**What was built**

- `frontend/`: Vite + React 19 + TypeScript, Tailwind CSS v4 (via `@tailwindcss/vite`), React Router
- Design token system in `src/index.css` (`@theme` block): navy/void palette, blue→violet
  signal gradient, Space Grotesk (display) + Inter (body) + JetBrains Mono (numeric data —
  timers, roll numbers, scores)
- Core UI primitives: `Button`, `Input`, `Card`, `Badge` (`src/components/ui/`) — `Badge`
  always pairs color with text/icon, never color-only, per the accessibility requirement
  in spec §48
- `AuthLayout` — the arena-grid background used behind every auth screen
- Two real screens, matching spec exactly:
  - `/login` — Roll Number + Password (§3). Deliberately not styled as a childish game login.
  - `/set-password` — New Password + Confirm New Password **only**, no current-password
    field (§4) — this is load-bearing, since the initial password was already validated
    during login and re-asking for it would break the flow.
- `AuthContext` — state shape is real (`isAuthenticated`, `user`, `requiresNewPassword`,
  `challengeSession`), but `loginWithRollNumber` / `completeNewPassword` throw with a
  clear "wired in Phase 2" message rather than faking success
- `apiClient` — thin fetch wrapper, attaches a JWT from `sessionStorage` once Phase 2 puts
  one there
- `backend/` and `infrastructure/` skeletons created (folder-per-domain, empty until the
  phase that needs them) so the structure in spec §49 is visible from Phase 1

**Why no backend yet**

Nothing in Phase 1 needs to be authoritative server-side — there's no real auth, no real
data. Standing up Cognito/API Gateway/Lambda before Phase 2 would mean deploying
infrastructure with nothing correct behind it. Phase 2 starts directly with Cognito.

**How to verify**

```bash
cd frontend
npm install
npm run build   # typechecks (tsc -b) + production build, currently clean
npm run dev     # visit /login and /set-password
```

**Known placeholders (intentional, not bugs)**

- Login/Set-password forms show a "wired in Phase 2" message instead of authenticating —
  this is expected until Cognito is connected.
- `/dashboard` and `/admin` are stub cards — full dashboards need student accounts and
  quizzes to exist first.

## Phase 2 — Authentication (next)

Cognito User Pool (username = roll number, `custom:role`, `custom:collegeEmail`,
`custom:firstLogin`), `NEW_PASSWORD_REQUIRED` challenge wired to `/set-password`,
API Gateway JWT authorizer, protected-route wrapper in the frontend.
