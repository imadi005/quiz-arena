import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { CognitoIdentityProviderClient, AdminEnableUserCommand, AdminDisableUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { requireAdminOrTeacher, jsonResponse, ForbiddenError } from './shared/authz'

const cognito = new CognitoIdentityProviderClient({})
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const USER_POOL_ID = process.env.USER_POOL_ID!
const TABLE_NAME = process.env.STUDENTS_TABLE_NAME!

export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdminOrTeacher(event)

    const rollNumber = event.pathParameters?.rollNumber?.trim().toUpperCase()
    const body = JSON.parse(event.body ?? '{}') as { status?: 'ACTIVE' | 'INACTIVE' }

    if (!rollNumber || (body.status !== 'ACTIVE' && body.status !== 'INACTIVE')) {
      return jsonResponse(400, { code: 'VALIDATION_ERROR', message: 'rollNumber and a valid status (ACTIVE/INACTIVE) are required.' })
    }

    if (body.status === 'ACTIVE') {
      await cognito.send(new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: rollNumber }))
    } else {
      await cognito.send(new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: rollNumber }))
    }

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { rollNumber },
        UpdateExpression: 'SET #s = :status',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':status': body.status },
      }),
    )

    return jsonResponse(200, { rollNumber, status: body.status })
  } catch (err) {
    if (err instanceof ForbiddenError) return jsonResponse(403, { code: 'FORBIDDEN', message: err.message })
    console.error(err)
    return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'Could not update student status.' })
  }
}
