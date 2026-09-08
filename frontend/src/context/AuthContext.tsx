import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CognitoUser } from 'amazon-cognito-identity-js'
import * as cognitoAuth from '@/services/cognitoAuth'
import type { AuthState, Role, UserProfile } from '@/types'

interface AuthContextValue extends AuthState {
  loginWithUsername: (username: string, password: string) => Promise<{ requiresNewPassword: boolean; role?: Role }>
  completeNewPassword: (newPassword: string) => Promise<Role | undefined>
  logout: () => void
  isCognitoConfigured: boolean
  /**
   * Classroom-without-internet fallback: unlocks the admin routes with a local
   * passcode instead of a real Cognito login, since Cognito needs AWS network access.
   * Returns false (no state change) if the passcode doesn't match.
   */
  unlockLocalAdmin: (username: string, passcode: string) => boolean
}

const LOCAL_ADMIN_PASSCODE = (import.meta.env.VITE_LOCAL_ADMIN_PASSCODE as string | undefined) ?? 'admin123'

const AuthContext = createContext<AuthContextValue | null>(null)

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  requiresNewPassword: false,
  challengeSession: null,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)
  // Held in memory only (not state) — a live Cognito SDK object, not serializable.
  const [pendingChallengeUser, setPendingChallengeUser] = useState<CognitoUser | null>(null)

  const loginWithUsername = async (username: string, password: string) => {
    const result = await cognitoAuth.login(username, password)

    if (result.status === 'NEW_PASSWORD_REQUIRED') {
      setPendingChallengeUser(result.cognitoUser ?? null)
      setState((s) => ({ ...s, requiresNewPassword: true }))
      return { requiresNewPassword: true }
    }

    setState({
      isAuthenticated: true,
      user: buildProfileStub(username, result.role),
      requiresNewPassword: false,
      challengeSession: null,
    })
    persistIdToken(result.session)
    return { requiresNewPassword: false, role: result.role }
  }

  const completeNewPassword = async (newPassword: string) => {
    if (!pendingChallengeUser) {
      throw new Error('No pending password challenge — please log in again.')
    }
    const session = await cognitoAuth.completeNewPasswordChallenge(pendingChallengeUser, newPassword)
    const role = session.getIdToken().payload['custom:role'] as Role | undefined

    setState({
      isAuthenticated: true,
      user: buildProfileStub(pendingChallengeUser.getUsername(), role),
      requiresNewPassword: false,
      challengeSession: null,
    })
    persistIdToken(session)
    setPendingChallengeUser(null)
    return role
  }

  const unlockLocalAdmin = (username: string, passcode: string) => {
    if (passcode !== LOCAL_ADMIN_PASSCODE) return false
    setState({
      isAuthenticated: true,
      user: {
        userId: username || 'admin',
        rollNumber: '',
        name: username || 'Admin',
        collegeEmail: username,
        role: 'ADMIN',
        status: 'ACTIVE',
        firstLogin: false,
        createdAt: new Date().toISOString(),
      },
      requiresNewPassword: false,
      challengeSession: null,
    })
    return true
  }

  const logout = () => {
    if (cognitoAuth.isCognitoConfigured()) cognitoAuth.signOut()
    sessionStorage.removeItem('idToken')
    setState(initialState)
    setPendingChallengeUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      loginWithUsername,
      completeNewPassword,
      logout,
      isCognitoConfigured: cognitoAuth.isCognitoConfigured(),
      unlockLocalAdmin,
    }),
    [state, pendingChallengeUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Minimal profile until Phase 3 wires GET /students/:id for the full record.
function buildProfileStub(username: string, role?: Role): UserProfile {
  return {
    userId: username,
    rollNumber: role === 'STUDENT' ? username : '',
    name: username,
    collegeEmail: role !== 'STUDENT' ? username : '',
    role: role ?? 'STUDENT',
    status: 'ACTIVE',
    firstLogin: false,
    createdAt: new Date().toISOString(),
  }
}

function persistIdToken(session: { getIdToken: () => { getJwtToken: () => string } } | undefined) {
  if (!session) return
  sessionStorage.setItem('idToken', session.getIdToken().getJwtToken())
}

export type { UserProfile }
