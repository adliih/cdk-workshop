import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import { Construct } from "constructs";

export interface HitCounterProps {
  downstream: lambda.IFunction;
}

export class HitCounter extends Construct {
  /** allows accessing the counter function */
  public readonly handler: lambda.Function;

  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, { downstream }: HitCounterProps) {
    super(scope, id);

    this.table = new dynamodb.Table(scope, "Hits", {
      partitionKey: {
        name: "path",
        type: dynamodb.AttributeType.STRING,
      },
    });

    this.handler = new lambda.Function(this, "HitCounterHanlder", {
      code: lambda.Code.fromAsset("lambda"),
      handler: "hitcounter.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        HITS_TABLE_NAME: this.table.tableName,
        DOWNSTREAM_FUNCTION_NAME: downstream.functionName,
      },
    });

    // grant the lambda role read/write permissions to our table
    this.table.grantReadWriteData(this.handler);
    downstream.grantInvoke(this.handler);
  }
}
