import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { requireAdminOrTeacher, jsonResponse, ForbiddenError } from './shared/authz'
import { generateTempPassword } from './shared/password'
import { isEmailAuthorized } from './shared/emailAuth'

const cognito = new CognitoIdentityProviderClient({})
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const USER_POOL_ID = process.env.USER_POOL_ID!
const TABLE_NAME = process.env.STUDENTS_TABLE_NAME!

interface ImportRow {
  rollNumber: string
  name: string
  collegeEmail: string
}

interface RowResult {
  rollNumber: string
  status: 'CREATED' | 'SKIPPED'
  reason?: string
  temporaryPassword?: string
}

// Frontend parses the CSV client-side (papaparse) and sends structured rows here — the
// backend re-validates everything regardless, since client validation is only a UX nicety,
// never a security boundary.
export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdminOrTeacher(event)

    const body = JSON.parse(event.body ?? '{}') as { rows?: ImportRow[] }
    const rows = body.rows ?? []

    if (rows.length === 0) {
      return jsonResponse(400, { code: 'VALIDATION_ERROR', message: 'No rows to import.' })
    }
    if (rows.length > 500) {
      return jsonResponse(400, { code: 'TOO_MANY_ROWS', message: 'Import at most 500 students at a time.' })
    }

    const seenRollNumbers = new Set<string>()
    const seenEmails = new Set<string>()
    const results: RowResult[] = []

    for (const row of rows) {
      const rollNumber = row.rollNumber?.trim().toUpperCase()
      const name = row.name?.trim()
      const collegeEmail = row.collegeEmail?.trim().toLowerCase()

      if (!rollNumber || !name || !collegeEmail) {
        results.push({ rollNumber: rollNumber ?? '(missing)', status: 'SKIPPED', reason: 'Missing required field(s).' })
        continue
      }
      if (!/^\S+@\S+\.\S+$/.test(collegeEmail)) {
        results.push({ rollNumber, status: 'SKIPPED', reason: 'Invalid email format.' })
        continue
      }
      if (!isEmailAuthorized(collegeEmail)) {
        results.push({ rollNumber, status: 'SKIPPED', reason: 'Email domain not authorized.' })
        continue
      }
      if (seenRollNumbers.has(rollNumber) || seenEmails.has(collegeEmail)) {
        results.push({ rollNumber, status: 'SKIPPED', reason: 'Duplicate within this CSV file.' })
        continue
      }

      const existing = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { rollNumber } }))
      if (existing.Item) {
        results.push({ rollNumber, status: 'SKIPPED', reason: 'Roll number already exists.' })
        continue
      }

      seenRollNumbers.add(rollNumber)
      seenEmails.add(collegeEmail)

      try {
        const temporaryPassword = generateTempPassword()
        await cognito.send(
          new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: rollNumber,
            TemporaryPassword: temporaryPassword,
            MessageAction: 'SUPPRESS',
            UserAttributes: [
              { Name: 'email', Value: collegeEmail },
              { Name: 'name', Value: name },
              { Name: 'custom:role', Value: 'STUDENT' },
              { Name: 'custom:rollNumber', Value: rollNumber },
            ],
          }),
        )
        await ddb.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: { rollNumber, name, collegeEmail, status: 'ACTIVE', firstLogin: true, createdAt: new Date().toISOString() },
          }),
        )
        results.push({ rollNumber, status: 'CREATED', temporaryPassword })
      } catch (err) {
        console.error(`Failed to create ${rollNumber}:`, err)
        results.push({ rollNumber, status: 'SKIPPED', reason: 'Cognito user creation failed.' })
      }
    }

    const created = results.filter((r) => r.status === 'CREATED').length
    return jsonResponse(200, { created, skipped: results.length - created, results })
  } catch (err) {
    if (err instanceof ForbiddenError) return jsonResponse(403, { code: 'FORBIDDEN', message: err.message })
    console.error(err)
    return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'Import failed.' })
  }
}
