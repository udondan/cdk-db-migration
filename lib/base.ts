import iam = require('@aws-cdk/aws-iam');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/core');

import { ensureLambda } from './lambda';

const resourceType = 'Custom::DB-Migration';

export interface LambdaProps {
  [key: string]: String;
}

/**
 * Manages Database Migration
 */
export interface Props extends cdk.StackProps {
  /**
   * Migration to apply, when the resource is created
   */
  readonly up: string;

  /**
   * Migration to apply, when the resource is deleted
   */
  readonly down: string;

  /**
   * One or more cdk constructs the migration depends on
   */
  readonly dependsOn?: cdk.Construct | cdk.Construct[];

  /**
   * Timeout of the lambda function, which is used to run the migrations
   *
   * @default - 30 seconds
   */
  readonly timeout?: cdk.Duration;
}

/**
 * Defines a new DB Migration
 */
export class Base extends cdk.Construct {
  /**
   * The lambda function which backs the custom resource
   */
  public readonly lambda: lambda.IFunction;

  /**
   * The IAM role, used by the lambda function which backs the custom resource
   */
  public readonly role: iam.Role;
  /**
   * Migration to apply, when the resource is deleted
   */
  public readonly up: string;

  /**
   * Migration to apply, when the resource is deleted
   */
  public readonly down: string;

  /**
   * Defines a new DB Migration
   */
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const lambdaResources = ensureLambda(this);

    this.lambda = lambdaResources.function;
    this.role = lambdaResources.role;
    this.up = props.up.trim();
    this.down = props.down.trim();

    const queryProps: cdk.CustomResourceProps = {
      serviceToken: this.lambda.functionArn,
      resourceType: `${resourceType}-${this.getType()}`,
      properties: this.getProperties(props),
    };

    const query = new cdk.CustomResource(this, `DbMigration${id}`, queryProps);

    if (typeof props.dependsOn !== 'undefined') {
      if (Array.isArray(props.dependsOn)) {
        query.node.addDependency(...props.dependsOn);
      } else {
        query.node.addDependency(props.dependsOn);
      }
    }
  }

  protected getProperties(_: Props): LambdaProps {
    return {
      Up: this.up,
      Down: this.down,
    };
  }

  protected getType() {
    return 'Base';
  }
}
