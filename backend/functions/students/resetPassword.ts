import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { requireAdminOrTeacher, jsonResponse, ForbiddenError } from './shared/authz'
import { generateTempPassword } from './shared/password'

const cognito = new CognitoIdentityProviderClient({})
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const USER_POOL_ID = process.env.USER_POOL_ID!
const TABLE_NAME = process.env.STUDENTS_TABLE_NAME!

// Admin can reset a student's password to a new temporary one — Cognito never exposes the
// existing password to anyone, including admins (spec §2: "Admin must NEVER be able to view
// an existing password"), so "reset" is the only lever available, not "view" or "recover".
export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdminOrTeacher(event)

    const rollNumber = event.pathParameters?.rollNumber?.trim().toUpperCase()
    if (!rollNumber) {
      return jsonResponse(400, { code: 'VALIDATION_ERROR', message: 'Roll number is required.' })
    }

    const temporaryPassword = generateTempPassword()

    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: rollNumber,
        Password: temporaryPassword,
        Permanent: false, // forces the NEW_PASSWORD_REQUIRED challenge again on next login
      }),
    )

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { rollNumber },
        UpdateExpression: 'SET firstLogin = :true',
        ExpressionAttributeValues: { ':true': true },
      }),
    )

    return jsonResponse(200, { rollNumber, temporaryPassword })
  } catch (err) {
    if (err instanceof ForbiddenError) return jsonResponse(403, { code: 'FORBIDDEN', message: err.message })
    console.error(err)
    return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'Could not reset password.' })
  }
}
