import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

export interface DataStackProps extends cdk.StackProps {
  envName: string
}

/**
 * Phase 3 — Student management data layer.
 *
 * Students table: PK = rollNumber (matches the Cognito username 1:1, so a lookup by roll
 * number needs no index). A GSI on collegeEmail supports duplicate-email checks during
 * CSV import without a full table scan.
 */
export class DataStack extends cdk.Stack {
  public readonly studentsTable: dynamodb.Table

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props)

    this.studentsTable = new dynamodb.Table(this, 'StudentsTable', {
      tableName: `quiz-arena-students-${props.envName}`,
      partitionKey: { name: 'rollNumber', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy:
        props.envName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    })

    this.studentsTable.addGlobalSecondaryIndex({
      indexName: 'byCollegeEmail',
      partitionKey: { name: 'collegeEmail', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    new cdk.CfnOutput(this, 'StudentsTableName', { value: this.studentsTable.tableName })
  }
}
