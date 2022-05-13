import { aws_iam, aws_lambda, CustomResource, CustomResourceProps, Duration, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ensureLambda } from './lambda';

const resourceType = 'Custom::DB-Migration';

export interface LambdaProps {
  [key: string]: String;
}

/**
 * Manages Database Migration
 */
export interface Props extends StackProps {
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
  readonly dependsOn?: Construct | Construct[];

  /**
   * Timeout of the lambda function, which is used to run the migrations
   *
   * @default - 30 seconds
   */
  readonly timeout?: Duration;
}

/**
 * Defines a new DB Migration
 */
export class Base extends Construct {
  /**
   * The lambda function which backs the custom resource
   */
  public readonly lambda: aws_lambda.IFunction;

  /**
   * The IAM role, used by the lambda function which backs the custom resource
   */
  public readonly role: aws_iam.Role;
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
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const lambdaResources = ensureLambda(this);

    this.lambda = lambdaResources.function;
    this.role = lambdaResources.role;
    this.up = props.up.trim();
    this.down = props.down.trim();

    const queryProps: CustomResourceProps = {
      serviceToken: this.lambda.functionArn,
      resourceType: `${resourceType}-${this.makeType()}`,
      properties: this.makeProperties(props),
    };

    const query = new CustomResource(this, `DbMigration${id}`, queryProps);

    if (typeof props.dependsOn !== 'undefined') {
      if (Array.isArray(props.dependsOn)) {
        query.node.addDependency(...props.dependsOn);
      } else {
        query.node.addDependency(props.dependsOn);
      }
    }
  }

  protected makeProperties(_: Props): LambdaProps {
    return {
      Up: this.up,
      Down: this.down,
    };
  }

  protected makeType() {
    return 'Base';
  }
}
