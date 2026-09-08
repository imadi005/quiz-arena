import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'

export class ForbiddenError extends Error {}

/**
 * API Gateway's JWT authorizer (Phase 2's Cognito User Pool) already verified the token
 * signature before the Lambda runs — we only need to read the role claim out of it here,
 * not re-verify anything.
 */
export function requireAdminOrTeacher(event: APIGatewayProxyEventV2WithJWTAuthorizer): void {
  const claims = event.requestContext.authorizer?.jwt?.claims
  const role = claims?.['custom:role']
  if (role !== 'ADMIN' && role !== 'TEACHER') {
    throw new ForbiddenError('Admin or teacher role required.')
  }
}

export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
