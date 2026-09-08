#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { AuthStack } from '../lib/auth-stack'
import { DataStack } from '../lib/data-stack'
import { ApiStack } from '../lib/api-stack'

const app = new cdk.App()

const envName = app.node.tryGetContext('envName') ?? 'dev'
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
}

const authStack = new AuthStack(app, `QuizArena-Auth-${envName}`, { envName, env })
const dataStack = new DataStack(app, `QuizArena-Data-${envName}`, { envName, env })

new ApiStack(app, `QuizArena-Api-${envName}`, {
  envName,
  env,
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  studentsTable: dataStack.studentsTable,
  // Set this via `cdk deploy -c allowedEmailDomains=college.edu,other.edu` — leave unset
  // during initial testing to allow any email domain.
  allowedEmailDomains: app.node.tryGetContext('allowedEmailDomains'),
})
