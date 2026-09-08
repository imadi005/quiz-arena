import { apiClient } from './apiClient'
import type { Student, StudentStatus } from '@/types'

interface CreateStudentResponse {
  student: Student
  temporaryPassword: string
}

interface ImportRow {
  rollNumber: string
  name: string
  collegeEmail: string
}

interface ImportRowResult {
  rollNumber: string
  status: 'CREATED' | 'SKIPPED'
  reason?: string
  temporaryPassword?: string
}

interface ImportResponse {
  created: number
  skipped: number
  results: ImportRowResult[]
}

export const studentsApi = {
  list: () => apiClient.get<{ students: Student[] }>('/students'),

  create: (input: { rollNumber: string; name: string; collegeEmail: string }) =>
    apiClient.post<CreateStudentResponse>('/students', input),

  importCsv: (rows: ImportRow[]) => apiClient.post<ImportResponse>('/students/import', { rows }),

  resetPassword: (rollNumber: string) =>
    apiClient.post<{ rollNumber: string; temporaryPassword: string }>(`/students/${rollNumber}/reset-password`),

  setStatus: (rollNumber: string, status: StudentStatus) =>
    apiClient.patch<{ rollNumber: string; status: StudentStatus }>(`/students/${rollNumber}`, { status }),
}
