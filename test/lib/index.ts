import * as aws_glue from '@aws-cdk/aws-glue-alpha';
import { aws_kms, aws_s3, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { EncryptionOption, WorkGroup } from 'cdk-athena';
import * as statement from 'cdk-iam-floyd';
import { Construct } from 'constructs';

import * as Migration from '../../lib';

export class TestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const tableName = `test_table`;
    const dbName = this.stackName.toLowerCase();

    const bucket = new aws_s3.Bucket(this, 'Bucket', {
      encryptionKey: aws_kms.Alias.fromAliasName(this, 'Key', 'aws/s3'),
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const db = new aws_glue.Database(this, 'Database', {
      databaseName: dbName,
    });

    const workgroup = new WorkGroup(this, 'WorkGroup', {
      name: `${this.stackName}-test-workgroup`,
      resultConfiguration: {
        outputLocation: `s3://${bucket.bucketName}/output`,
        encryptionConfiguration: {
          encryptionOption: EncryptionOption.SSE_S3,
        },
      },
    });

    const m1 = new Migration.Athena(this, 'M1', {
      dependsOn: [bucket, db, workgroup],
      workGroup: workgroup.name,
      up: `
        CREATE EXTERNAL TABLE ${dbName}.${tableName} (
          Id INT,
          Name STRING,
          Address STRING
        )
        PARTITIONED BY (
          date STRING
        )
        ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
        LOCATION 's3://${bucket.bucketName}/input';
      `,
      down: `DROP TABLE ${dbName}.${tableName};`,
    });

    new Migration.Athena(this, 'M2', {
      dependsOn: [m1],
      workGroup: workgroup.name,
      up: `
        ALTER TABLE ${dbName}.${tableName}
        SET TBLPROPERTIES (
          'projection.enabled'='true',
          'projection.date.format'='yyyy/MM/dd',
          'projection.date.interval'='1',
          'projection.date.interval.unit'='DAYS',
          'projection.date.range'='2021/01/01,NOW',
          'projection.date.type'='date',
          'storage.location.template'='s3://${bucket.bucketName}/input/\${date}'
        );
      `,
      down: `
        ALTER TABLE ${dbName}.${tableName}
        SET TBLPROPERTIES (
          'projection.enabled'='false'
        );
      `,
    });

    bucket.grantReadWrite(m1.role);

    [
      new statement.S3()
        .allow()
        .toGetBucketLocation()
        .toListBucket()
        .toListBucketMultipartUploads()
        .toListMultipartUploadParts()
        .toAbortMultipartUpload()
        .onBucket(bucket.bucketName)
        .onObject(bucket.bucketName, '*'),
      new statement.Athena()
        .allow()
        .toStartQueryExecution()
        .toGetQueryExecution(),
      new statement.Glue()
        .allow()
        .toGetTable()
        .toGetDatabase()
        .toCreateTable()
        .toDeleteTable()
        .toUpdateTable()
        .toUpdatePartition(),
    ].forEach((statement) => {
      m1.role.addToPolicy(statement);
    });
  }
}
