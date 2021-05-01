import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/core');
import path = require('path');

type result = {
  function: lambda.Function;
  role: iam.Role;
};

export function ensureLambda(
  scope: cdk.Construct,
  timeout?: cdk.Duration
): result {
  const stack = cdk.Stack.of(scope);
  const lambdaName = 'DbMigrationManager';
  const existing = stack.node.tryFindChild(lambdaName);
  const roleName = `${lambdaName}-Role`;
  if (existing) {
    return {
      function: existing as lambda.Function,
      role: stack.node.tryFindChild(roleName) as iam.Role,
    };
  }

  const role = new iam.Role(stack, roleName, {
    roleName: `${stack.stackName}-${lambdaName}`,
    description: `Used by Lambda ${lambdaName}, which is a custom CFN resource, managing DB migrations`,
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      ),
    ],
  });

  const fn = new lambda.Function(stack, lambdaName, {
    functionName: `${stack.stackName}-${lambdaName}`,
    role: role,
    description: 'Custom CFN resource: Manages DB migrations',
    runtime: lambda.Runtime.NODEJS_14_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/code.zip')),
    timeout: timeout || cdk.Duration.seconds(30),
  });

  return {
    function: fn,
    role: role,
  };
}
