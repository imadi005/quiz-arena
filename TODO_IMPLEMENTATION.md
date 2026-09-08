# TODO_IMPLEMENTATION.md — Quiz Arena

Concrete, checkable tasks per phase. Checked items are verified (build/tests passed), not just written.

## Phase 2 — Authentication (in progress)
- [ ] CDK stack: Cognito User Pool (username = roll number for students, email for admins;
      custom attributes: `custom:role`, `custom:collegeEmail`, `custom:firstLogin`)
- [ ] CDK stack: two app clients or one pool + role-based routing post-login
- [ ] Lambda: `PreSignUp` trigger enforcing email-domain / individual-email authorization
- [ ] Frontend: install `aws-amplify` (or `amazon-cognito-identity-js`), wire `AuthContext` to
      real `signIn`, handle `NEW_PASSWORD_REQUIRED` challenge
- [ ] Frontend: protected-route wrapper reading role from ID token claims
- [ ] `cdk synth` succeeds locally (no deploy yet — no AWS network access in this sandbox)
- [ ] **BLOCKED on your action:** actual `cdk deploy`, and giving me back the User Pool ID /
      Client ID to put in `.env`

## Phase 3 — Student management (real API)
- [ ] DynamoDB table + access patterns for `Users`
- [ ] Lambda: `POST /students`, `GET /students`, `PATCH /students/:id`, `POST /students/import`
- [ ] CSV import validation (duplicate roll/email, invalid email, domain check)
- [ ] Frontend: replace `mockStudents` usage in `AdminStudentsPage` with real `apiClient` calls
- [ ] Admin: reset-password action calls Cognito `AdminSetUserPassword` (temporary)

## Phase 4 — Question bank (real API)
- [ ] DynamoDB access patterns for `Questions` (by category, by quiz)
- [ ] Lambda: CRUD + duplicate
- [ ] Frontend: replace `mockQuestions` in `AdminQuestionsPage`

## Phase 5 — Quiz creation (real API)
- [ ] DynamoDB `Quizzes` entity + settings blob
- [ ] Lambda: create/list/update/start/pause/end
- [ ] Frontend: replace `mockQuizzes` in `AdminQuizzesPage`, build the actual "Create Quiz" form

## Phase 6 — Student exam engine
- [ ] `QuizSessions` + `Answers` DynamoDB entities
- [ ] Lambda: start session (server generates `expiresAt`), get questions (answers stripped),
      save answer, mark for review, submit
- [ ] Frontend: full exam UI — palette, roadmap, timer synced to `expiresAt`, autosave with
      retry/offline handling, submit confirmation modal
- [ ] `useTimer`, `useQuizSession`, `useQuestionPalette` hooks

## Phase 7 — Scoring
- [ ] Server-side score/accuracy calculation on submit (never trust client)
- [ ] Result screen wired to real `GET /sessions/:id/result`

## Phase 8 — Anti-malpractice
- [ ] `useMalpractice` hook: `visibilitychange`, `blur`/`focus`, `fullscreenchange` listeners
- [ ] `POST /sessions/:id/malpractice` — backend increments count, returns authoritative status
- [ ] Backend enforces termination at configured limit; frontend reacts to backend response,
      never decides termination itself
- [ ] `MalpracticeEvents` table + audit trail

## Phase 9 — Real-time monitoring
- [ ] API Gateway WebSocket API + connection-management Lambda
- [ ] `useRealtime` hook
- [ ] Wire `AdminLiveMonitorPage` and `AdminLeaderboardPage` to live data instead of mock arrays

## Phase 10 — Gamification
- [ ] Achievement rules (streaks, accuracy thresholds, rank)
- [ ] Confetti + rank-change animation on result screen

## Phase 11 — Analytics
- [ ] Real aggregation Lambda (score distribution, question accuracy, participation)
- [ ] Wire `AdminAnalyticsPage` to it

## Phase 12 — Security hardening
- [ ] API Gateway JWT authorizer on every route
- [ ] Per-role IAM least privilege for each Lambda
- [ ] Input validation (zod/ajv) on every handler
- [ ] Rate limiting (usage plans / throttling)
- [ ] Audit log writes on sensitive actions

## Phase 13 — Testing
- [ ] Unit: scoring, ranking, malpractice rule, question-state reducer
- [ ] Integration: auth flow, CRUD, submission
- [ ] E2E: full student + admin journey

## Phase 14 — AWS deployment — requires your AWS account
- [ ] You run `aws configure` with your credentials
- [ ] You run `cdk bootstrap`
- [ ] You run `cdk deploy --all` (I'll give exact commands when the stack is ready)
- [ ] I cannot do this step from this sandbox — no AWS network egress here
