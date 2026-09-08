# Quiz Arena

A production-track online examination + competition platform: Roll-Number login,
Kahoot-style live leaderboard, browser-based malpractice detection, AWS serverless backend.

Built phase by phase — see `DEVELOPMENT_LOG.md` for phase-by-phase status.

## Structure

```
quiz-arena/
├── frontend/        React + TypeScript + Vite + Tailwind v4
├── backend/          Lambda functions, one folder per domain
├── infrastructure/   AWS CDK (provisioned incrementally per phase)
├── tests/            unit / integration / e2e
```

## Status: Phase 1 complete

- [x] Phase 1 — Project foundation
- [ ] Phase 2 — Authentication (Cognito, Roll Number login, first-login password flow)
- [ ] Phase 3 — Student management
- [ ] Phase 4 — Question bank
- [ ] Phase 5 — Quiz creation
- [ ] Phase 6 — Student quiz interface
- [ ] Phase 7 — Scoring
- [ ] Phase 8 — Anti-malpractice
- [ ] Phase 9 — Live admin monitoring
- [ ] Phase 10 — Live leaderboard
- [ ] Phase 11 — Gamification
- [ ] Phase 12 — Analytics
- [ ] Phase 13 — Security hardening
- [ ] Phase 14 — Testing
- [ ] Phase 15 — AWS deployment

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `/login` (default redirect from `/`) to see the Roll Number login screen,
and `/set-password` to see the first-login password screen.
