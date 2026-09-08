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

interface CreateStudentBody {
  rollNumber: string
  name: string
  collegeEmail: string
}

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdminOrTeacher(event)

    const body = JSON.parse(event.body ?? '{}') as Partial<CreateStudentBody>
    const rollNumber = body.rollNumber?.trim().toUpperCase()
    const name = body.name?.trim()
    const collegeEmail = body.collegeEmail?.trim().toLowerCase()

    if (!rollNumber || !name || !collegeEmail) {
      return jsonResponse(400, { code: 'VALIDATION_ERROR', message: 'rollNumber, name, and collegeEmail are all required.' })
    }
    if (!/^\S+@\S+\.\S+$/.test(collegeEmail)) {
      return jsonResponse(400, { code: 'INVALID_EMAIL', message: 'That does not look like a valid email address.' })
    }
    if (!isEmailAuthorized(collegeEmail)) {
      return jsonResponse(403, { code: 'EMAIL_NOT_AUTHORIZED', message: 'This email domain is not authorized for student accounts.' })
    }

    const existing = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { rollNumber } }))
    if (existing.Item) {
      return jsonResponse(409, { code: 'DUPLICATE_ROLL_NUMBER', message: `A student with roll number ${rollNumber} already exists.` })
    }

    const temporaryPassword = generateTempPassword()

    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: rollNumber,
        TemporaryPassword: temporaryPassword,
        MessageAction: 'SUPPRESS', // admin hands the password to the student directly
        UserAttributes: [
          { Name: 'email', Value: collegeEmail },
          { Name: 'name', Value: name },
          { Name: 'custom:role', Value: 'STUDENT' },
          { Name: 'custom:rollNumber', Value: rollNumber },
        ],
      }),
    )

    const record = {
      rollNumber,
      name,
      collegeEmail,
      status: 'ACTIVE' as const,
      firstLogin: true,
      createdAt: new Date().toISOString(),
    }
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: record }))

    return jsonResponse(201, { student: record, temporaryPassword })
  } catch (err) {
    if (err instanceof ForbiddenError) return jsonResponse(403, { code: 'FORBIDDEN', message: err.message })
    console.error(err)
    return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'Could not create student.' })
  }
}
