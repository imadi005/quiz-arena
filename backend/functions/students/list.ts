import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { requireAdminOrTeacher, jsonResponse, ForbiddenError } from './shared/authz'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.STUDENTS_TABLE_NAME!

// Scan is fine at this scale (hundreds to low thousands of students per college). If this
// ever needs to serve a much larger institution, switch to a paginated Query against a
// status-based GSI instead.
export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdminOrTeacher(event)

    const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }))
    const students = (result.Items ?? []).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))

    return jsonResponse(200, { students })
  } catch (err) {
    if (err instanceof ForbiddenError) return jsonResponse(403, { code: 'FORBIDDEN', message: err.message })
    console.error(err)
    return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'Could not list students.' })
  }
}
