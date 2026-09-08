import * as cdk from 'aws-cdk-lib'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import { Construct } from 'constructs'

export interface AuthStackProps extends cdk.StackProps {
  envName: string
}

/**
 * Phase 2 — Authentication.
 *
 * One User Pool serves both roles:
 *  - Students: Cognito username = roll number (e.g. "KJ23MCA001"). Admin creates the account
 *    with AdminCreateUser + a temporary password, which puts the user in
 *    FORCE_CHANGE_PASSWORD status — Cognito's built-in NEW_PASSWORD_REQUIRED challenge covers
 *    the "no current-password field" first-login requirement natively, no custom firstLogin
 *    bookkeeping needed.
 *  - Admins/teachers: Cognito username = their email address. Same pool, same mechanism.
 *
 * Email is NOT configured as a sign-in alias — that would let students sign in with their
 * college email, which the spec explicitly forbids. Role separation happens entirely through
 * what value was used as `username` at creation time, tagged by the `custom:role` attribute.
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool
  public readonly userPoolClient: cognito.UserPoolClient

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props)

    this.userPool = new cognito.UserPool(this, 'QuizArenaUserPool', {
      userPoolName: `quiz-arena-users-${props.envName}`,
      selfSignUpEnabled: false, // accounts are created by admins only
      signInAliases: { username: true }, // no email alias — see class doc
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }), // STUDENT | TEACHER | ADMIN
        rollNumber: new cognito.StringAttribute({ mutable: false }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        props.envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    })

    this.userPoolClient = this.userPool.addClient('QuizArenaWebClient', {
      userPoolClientName: `quiz-arena-web-${props.envName}`,
      authFlows: {
        userPassword: true, // USER_PASSWORD_AUTH — needed for the NEW_PASSWORD_REQUIRED challenge flow
        userSrp: true,
      },
      generateSecret: false, // public SPA client
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      preventUserExistenceErrors: true,
    })

    // Admin group vs Student group — used later for coarse API Gateway authorization
    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'ADMIN',
      description: 'Admins and teachers who manage students, questions, and quizzes',
    })
    new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'STUDENT',
      description: 'Students who take quizzes',
    })

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId })
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId })
    new cdk.CfnOutput(this, 'Region', { value: this.region })
  }
}
