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
  quizId: string
  attemptsUsed: number
  maxAttempts: number
  attemptsRemaining: number
  bestScore: number | null
  totalMarks: number
}

export type QuizStatusValue = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'COMPLETED'

export type QuizStatusResponse =
  | { live: false }
  | { live: true; quizId: string; title: string; duration: number; questionCount: number }

export interface AdminQuiz {
  quizId: string
  title: string
  description: string
  duration: number
  status: QuizStatusValue
  createdAt: string
  questionCount: number
  completed: number
  averageScore: number
  studentsOnline: number
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
  getQuizStatus: () => request<QuizStatusResponse>('/quiz-status'),
  getQuestions: () => request<PublicQuestion[]>('/questions'),
  getAttemptStatus: (rollNumber: string, quizId: string) =>
    request<AttemptStatus>(`/attempts/${encodeURIComponent(rollNumber)}?quizId=${encodeURIComponent(quizId)}`),
  submit: (quizId: string, rollNumber: string, name: string, answers: number[]) =>
    request<SubmitResult>('/submit', {
      method: 'POST',
      body: JSON.stringify({ quizId, rollNumber, name, answers }),
    }),
  getLeaderboard: (quizId?: string) =>
    request<LeaderboardRow[]>(`/leaderboard${quizId ? `?quizId=${encodeURIComponent(quizId)}` : ''}`),

  getAdminQuestions: () => request<AdminQuestion[]>('/admin/questions'),
  addAdminQuestion: (question: Omit<AdminQuestion, 'questionId'>) =>
    request<AdminQuestion>('/admin/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    }),
  deleteAdminQuestion: (questionId: string) =>
    request<void>(`/admin/questions/${encodeURIComponent(questionId)}`, { method: 'DELETE' }),

  getAdminQuizzes: () => request<AdminQuiz[]>('/admin/quizzes'),
  createAdminQuiz: (quiz: { title: string; description: string; duration: number }) =>
    request<AdminQuiz>('/admin/quizzes', { method: 'POST', body: JSON.stringify(quiz) }),
  patchAdminQuiz: (quizId: string, action: 'start' | 'pause' | 'end') =>
    request<AdminQuiz>(`/admin/quizzes/${encodeURIComponent(quizId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),
}
