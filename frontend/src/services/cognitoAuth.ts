import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js'
import type { Role } from '@/types'

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined

let pool: CognitoUserPool | null = null

function getPool(): CognitoUserPool {
  if (!userPoolId || !clientId) {
    throw new Error(
      'Cognito is not configured. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in frontend/.env ' +
        '(these come from `cdk deploy` output — see infrastructure/README.md).',
    )
  }
  if (!pool) {
    pool = new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId })
  }
  return pool
}

export interface LoginResult {
  status: 'SUCCESS' | 'NEW_PASSWORD_REQUIRED'
  session?: CognitoUserSession
  cognitoUser?: CognitoUser
  role?: Role
}

/**
 * Student login uses roll number as the Cognito username.
 * Admin login uses their email as the Cognito username.
 * Same pool, same call shape — the distinction only matters at account-creation time (Phase 3).
 */
export function login(username: string, password: string): Promise<LoginResult> {
  const cognitoUser = new CognitoUser({ Username: username, Pool: getPool() })
  const authDetails = new AuthenticationDetails({ Username: username, Password: password })

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken()
        const role = idToken.payload['custom:role'] as Role | undefined
        resolve({ status: 'SUCCESS', session, role })
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: () => {
        // Cognito's FORCE_CHANGE_PASSWORD challenge — this IS the "first login" case.
        // We deliberately do not surface the temporary password back to the caller;
        // completeNewPassword() below only ever asks for the new one.
        resolve({ status: 'NEW_PASSWORD_REQUIRED', cognitoUser })
      },
    })
  })
}

/**
 * Completes the NEW_PASSWORD_REQUIRED challenge. Only takes the new password — the temporary
 * password was already validated by login() above, so we never ask for it again.
 */
export function completeNewPasswordChallenge(
  cognitoUser: CognitoUser,
  newPassword: string,
): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(
      newPassword,
      {}, // no additional required attributes beyond what admin set at creation
      {
        onSuccess: (session) => resolve(session),
        onFailure: (err) => reject(err),
      },
    )
  })
}

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  const currentUser = getPool().getCurrentUser()
  if (!currentUser) return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) return reject(err)
      resolve(session)
    })
  })
}

export function signOut(): void {
  getPool().getCurrentUser()?.signOut()
}

export function isCognitoConfigured(): boolean {
  return Boolean(userPoolId && clientId)
}
