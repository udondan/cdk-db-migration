import cdk = require('@aws-cdk/core');

import { Base, LambdaProps, Props } from './base';

/**
 * Props for Athena Migrations
 */
export interface AthenaProps extends Props {
  /**
   * Athena WorkGroup to run the migration in
   *
   * @default - primary
   */
  readonly workGroup?: string;
}

/**
 * Defines a new DB Migration for Athena
 */
export class Athena extends Base {
  /**
   * Defines a new DB Migration
   */
  constructor(scope: cdk.Construct, id: string, props: AthenaProps) {
    super(scope, id, props);
  }

  protected getType() {
    return 'Athena';
  }

  protected getProperties(props: Props): LambdaProps {
    const properties: LambdaProps = super.getProperties(props);
    properties['WorkGroup'] = (props as AthenaProps).workGroup || 'primary';
    return properties;
  }
}
