# Infrastructure (AWS CDK)

## What's here now (Phase 2)

`lib/auth-stack.ts` — Cognito User Pool + App Client + ADMIN/STUDENT groups. This is the only
stack so far; more are added as each phase needs them (DynamoDB in Phase 3, API Gateway + Lambda
starting Phase 3 as well, WebSocket API in Phase 9).

**Verified so far:** `cdk synth` succeeds locally — the CloudFormation template is valid.
**Not verified:** actual deployment — that requires AWS credentials this sandbox doesn't have
access to (see root `PROJECT_STATUS.md`).

## What you need to do to actually deploy this

```bash
cd infrastructure
npm install

# One-time setup, only if you haven't used CDK in this AWS account/region before:
npx aws-cdk bootstrap

# Review what will be created (optional but recommended):
npx cdk diff

# Deploy:
npx cdk deploy
```

You'll need AWS credentials configured first (`aws configure`, or environment variables, or an
SSO profile) — this stack doesn't create an AWS account or credentials for you, only resources
inside one you already have.

## After it deploys

`cdk deploy` prints three outputs:

```text
QuizArena-Auth-dev.UserPoolId = ap-south-1_XXXXXXXXX
QuizArena-Auth-dev.UserPoolClientId = XXXXXXXXXXXXXXXXXXXXXXXXXX
QuizArena-Auth-dev.Region = ap-south-1
```

Copy those into `frontend/.env`:

```bash
VITE_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_AWS_REGION=ap-south-1
```

Restart `npm run dev` after editing `.env`. Once those three values are set, the Login page's
"Cognito is not configured" message goes away and real sign-in becomes possible — for a real
sign-in to succeed you'll also need at least one user in the pool, which is done via the AWS
Console for now (Cognito -> User pools -> your pool -> Users -> Create user, with Temporary
password set and "Send an invitation" unchecked) until Phase 3 builds the admin "Add Student"
API that does this properly.

## Destroying it

```bash
cd infrastructure
npx cdk destroy
```

(The dev-environment pool is configured to actually delete on stack removal; production
environments are configured to retain it, see RemovalPolicy in auth-stack.ts.)
