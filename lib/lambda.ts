import { aws_iam, aws_lambda, Duration, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path = require('path');

type result = {
  function: aws_lambda.Function;
  role: aws_iam.Role;
};

export function ensureLambda(scope: Construct, timeout?: Duration): result {
  const stack = Stack.of(scope);
  const lambdaName = 'DbMigrationManager';
  const existing = stack.node.tryFindChild(lambdaName);
  const roleName = `${lambdaName}-Role`;
  if (existing) {
    return {
      function: existing as aws_lambda.Function,
      role: stack.node.tryFindChild(roleName) as aws_iam.Role,
    };
  }

  const role = new aws_iam.Role(stack, roleName, {
    roleName: `${stack.stackName}-${lambdaName}`,
    description: `Used by Lambda ${lambdaName}, which is a custom CFN resource, managing DB migrations`,
    assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      ),
    ],
  });

  const fn = new aws_lambda.Function(stack, lambdaName, {
    functionName: `${stack.stackName}-${lambdaName}`,
    role: role,
    description: 'Custom CFN resource: Manages DB migrations',
    runtime: aws_lambda.Runtime.NODEJS_20_X,
    handler: 'index.handler',
    code: aws_lambda.Code.fromAsset(path.join(__dirname, '../lambda/code.zip')),
    timeout: timeout || Duration.seconds(30),
  });

  return {
    function: fn,
    role: role,
  };
}
