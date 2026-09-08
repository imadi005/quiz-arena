// Talks to the local-server (see /local-server) — no AWS, no internet required.
// In dev, Vite proxies /api to http://localhost:4000. In the classroom build,
// local-server serves the built frontend itself, so /api is same-origin.

export interface PublicQuestion {
  questionId: string
  questionText: string
  options: [string, string, string, string]
  marks: number
  difficulty: string
  category: string
}

export interface AdminQuestion extends PublicQuestion {
  correctAnswer: 0 | 1 | 2 | 3
}

export interface AttemptStatus {
  rollNumber: string
  attemptsUsed: number
  maxAttempts: number
  attemptsRemaining: number
  bestScore: number | null
  totalMarks: number
}

export interface SubmitResult {
  score: number
  totalMarks: number
  attemptsUsed: number
  attemptsRemaining: number
}

export interface LeaderboardRow {
  rank: number
  rollNumber: string
  name: string
  score: number
  totalMarks: number
  accuracy: number
  submittedAt: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? `Request failed (${res.status})`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const quizApi = {
  getQuestions: () => request<PublicQuestion[]>('/questions'),
  getAttemptStatus: (rollNumber: string) =>
    request<AttemptStatus>(`/attempts/${encodeURIComponent(rollNumber)}`),
  submit: (rollNumber: string, name: string, answers: number[]) =>
    request<SubmitResult>('/submit', {
      method: 'POST',
      body: JSON.stringify({ rollNumber, name, answers }),
    }),
  getLeaderboard: () => request<LeaderboardRow[]>('/leaderboard'),

  getAdminQuestions: () => request<AdminQuestion[]>('/admin/questions'),
  addAdminQuestion: (question: Omit<AdminQuestion, 'questionId'>) =>
    request<AdminQuestion>('/admin/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    }),
  deleteAdminQuestion: (questionId: string) =>
    request<void>(`/admin/questions/${encodeURIComponent(questionId)}`, { method: 'DELETE' }),
}
