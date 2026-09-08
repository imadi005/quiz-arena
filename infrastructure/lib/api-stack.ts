import * as cdk from 'aws-cdk-lib'
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2'
import * as authorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers'
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as path from 'path'
import { Construct } from 'constructs'

export interface ApiStackProps extends cdk.StackProps {
  envName: string
  userPool: cognito.UserPool
  userPoolClient: cognito.UserPoolClient
  studentsTable: dynamodb.Table
  /** Comma-separated allowed college email domains, e.g. "college.edu,kristujayanti.edu.in" */
  allowedEmailDomains?: string
}

const FUNCTIONS_DIR = path.join(__dirname, '../../backend/functions/students')

/**
 * Phase 3 — Student management API.
 *
 * One HTTP API (cheaper + simpler than REST API for this use case), one Cognito JWT
 * authorizer shared by every route (role-based authorization is then enforced per-handler
 * by reading the `custom:role` claim — see backend/functions/students/shared/authz.ts).
 */
export class ApiStack extends cdk.Stack {
  public readonly api: apigw.HttpApi

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props)

    const authorizer = new authorizers.HttpUserPoolAuthorizer('StudentsAuthorizer', props.userPool, {
      userPoolClients: [props.userPoolClient],
    })

    this.api = new apigw.HttpApi(this, 'QuizArenaApi', {
      apiName: `quiz-arena-api-${props.envName}`,
      corsPreflight: {
        allowOrigins: ['*'], // tightened to the real CloudFront origin in Phase 14
        allowMethods: [apigw.CorsHttpMethod.ANY],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    })

    const commonEnv = {
      USER_POOL_ID: props.userPool.userPoolId,
      STUDENTS_TABLE_NAME: props.studentsTable.tableName,
      ALLOWED_EMAIL_DOMAINS: props.allowedEmailDomains ?? '',
    }

    const backendRoot = path.join(__dirname, '../../backend')

    const makeFn = (id: string, entryFile: string) =>
      new lambdaNode.NodejsFunction(this, id, {
        entry: path.join(FUNCTIONS_DIR, entryFile),
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_22_X,
        environment: commonEnv,
        timeout: cdk.Duration.seconds(15),
        bundling: { minify: true, sourceMap: false },
        projectRoot: backendRoot,
        depsLockFilePath: path.join(backendRoot, 'package-lock.json'),
      })

    const createFn = makeFn('CreateStudentFn', 'create.ts')
    const listFn = makeFn('ListStudentsFn', 'list.ts')
    const importFn = makeFn('ImportStudentsFn', 'import.ts')
    const resetPasswordFn = makeFn('ResetPasswordFn', 'resetPassword.ts')
    const setStatusFn = makeFn('SetStatusFn', 'setStatus.ts')

    for (const fn of [createFn, listFn, importFn, resetPasswordFn, setStatusFn]) {
      props.studentsTable.grantReadWriteData(fn)
    }
    // Cognito admin actions aren't table-grantable — least-privilege IAM policy instead.
    const cognitoAdminPolicy = new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:AdminEnableUser',
        'cognito-idp:AdminDisableUser',
      ],
      resources: [props.userPool.userPoolArn],
    })
    for (const fn of [createFn, importFn, resetPasswordFn, setStatusFn]) {
      fn.addToRolePolicy(cognitoAdminPolicy)
    }

    const integ = (fn: lambdaNode.NodejsFunction) => new integrations.HttpLambdaIntegration(`${fn.node.id}Integration`, fn)

    this.api.addRoutes({ path: '/students', methods: [apigw.HttpMethod.POST], integration: integ(createFn), authorizer })
    this.api.addRoutes({ path: '/students', methods: [apigw.HttpMethod.GET], integration: integ(listFn), authorizer })
    this.api.addRoutes({ path: '/students/import', methods: [apigw.HttpMethod.POST], integration: integ(importFn), authorizer })
    this.api.addRoutes({ path: '/students/{rollNumber}/reset-password', methods: [apigw.HttpMethod.POST], integration: integ(resetPasswordFn), authorizer })
    this.api.addRoutes({ path: '/students/{rollNumber}', methods: [apigw.HttpMethod.PATCH], integration: integ(setStatusFn), authorizer })

    new cdk.CfnOutput(this, 'ApiUrl', { value: this.api.apiEndpoint })
  }
}
