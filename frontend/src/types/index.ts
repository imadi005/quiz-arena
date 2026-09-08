// Domain types shared across the app.
// Kept minimal in Phase 1 — expanded as later phases add quizzes/sessions.

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface UserProfile {
  userId: string
  rollNumber: string
  name: string
  collegeEmail: string
  role: Role
  status: 'ACTIVE' | 'INACTIVE'
  firstLogin: boolean
  createdAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  /** true when Cognito returned NEW_PASSWORD_REQUIRED */
  requiresNewPassword: boolean
  /** Cognito session token needed to complete the NEW_PASSWORD_REQUIRED challenge */
  challengeSession: string | null
}

export interface LoginCredentials {
  rollNumber: string
  password: string
}

export interface SetNewPasswordPayload {
  newPassword: string
  confirmPassword: string
}

export interface ApiError {
  code: string
  message: string
}

// ---------------------------------------------------------------
// Admin-side domain types. Real data arrives from the backend in
// Phases 3–12; until then these shapes back mock data so the admin
// UI can be built and reviewed ahead of the backend.
// ---------------------------------------------------------------

export type StudentStatus = 'ACTIVE' | 'INACTIVE'

export interface Student {
  studentId: string
  rollNumber: string
  name: string
  collegeEmail: string
  status: StudentStatus
  firstLogin: boolean
  createdAt: string
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Question {
  questionId: string
  questionText: string
  options: [string, string, string, string]
  correctAnswer: 0 | 1 | 2 | 3
  marks: number
  difficulty: Difficulty
  category: string
}

export type QuizStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

export interface Quiz {
  quizId: string
  title: string
  description: string
  questionCount: number
  duration: number // minutes
  difficulty: Difficulty
  status: QuizStatus
  malpracticeLimit: number
  navigation: 'Free Navigation' | 'Sequential Navigation'
  studentsOnline: number
  completed: number
  averageScore: number
}

export type LiveStudentStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'TERMINATED'

export interface LiveStudent {
  rollNumber: string
  name: string
  status: LiveStudentStatus
  violations: number
  malpracticeLimit: number
  currentQuestion: number
  totalQuestions: number
}

export interface LeaderboardEntry {
  rank: number
  rollNumber: string
  name: string
  score: number
  totalMarks: number
  accuracy: number
}

