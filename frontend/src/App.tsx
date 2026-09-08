import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SetNewPasswordPage } from '@/pages/auth/SetNewPasswordPage'
import { StudentDashboardPage } from '@/pages/student/DashboardPage'
import { QuizPage } from '@/pages/student/QuizPage'
import { ResultPage } from '@/pages/student/ResultPage'
import { AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { AdminStudentsPage } from '@/pages/admin/StudentsPage'
import { AdminQuestionsPage } from '@/pages/admin/QuestionsPage'
import { AdminQuizzesPage } from '@/pages/admin/QuizzesPage'
import { AdminLiveMonitorPage } from '@/pages/admin/LiveMonitorPage'
import { AdminLeaderboardPage } from '@/pages/admin/LeaderboardPage'
import { AdminAnalyticsPage } from '@/pages/admin/AnalyticsPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password" element={<SetNewPasswordPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminQuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quizzes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminQuizzesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/live-monitor"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminLiveMonitorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaderboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminLeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
