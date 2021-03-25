# CDK DB Migration

[![Source](https://img.shields.io/badge/Source-GitHub-blue?logo=github)][source]
[![Test](https://github.com/udondan/cdk-db-migration/workflows/Test/badge.svg)](https://github.com/udondan/cdk-db-migration/actions?query=workflow%3ATest)
[![GitHub](https://img.shields.io/github/license/udondan/cdk-db-migration)][license]
[![Docs](https://img.shields.io/badge/awscdk.io-cdk--db--migration-orange)][docs]

[![npm package](https://img.shields.io/npm/v/cdk-db-migration?color=brightgreen)][npm]
[![PyPI package](https://img.shields.io/pypi/v/cdk-db-migration?color=brightgreen)][PyPI]
[![NuGet package](https://img.shields.io/nuget/v/CDK.DB.Migration?color=brightgreen)][NuGet]

![Downloads](https://img.shields.io/badge/-DOWNLOADS:-brightgreen?color=gray)
[![npm](https://img.shields.io/npm/dt/cdk-db-migration?label=npm&color=blueviolet)][npm]
[![PyPI](https://img.shields.io/pypi/dm/cdk-db-migration?label=pypi&color=blueviolet)][PyPI]
[![NuGet](https://img.shields.io/nuget/dt/CDK.DB.Migration?label=nuget&color=blueviolet)][NuGet]

[AWS CDK] L3 construct for managing DB migrations. Currently implemented DBMS:

- Athena

I created this construct because [CloudFormations Glue Table](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-table.html) doesn't support `TBLPROPERTIES`. I needed an alternative to create a table. Since creating a table is a DB migration, I created a migration construct instead of a simple table construct, which would be hard to impossible to update.

## Usage

```typescript
import * as Migration from 'cdk-db-migration';

const m1 = new Migration.Athena(this, 'M1', {
  up: 'CREATE EXTERNAL TABLE foo ...;',
  down: 'DROP TABLE foo;',
 });

const m2 = new Migration.Athena(this, 'M2', {
  dependsOn: m1,
  up: 'ALTER TABLE foo ...;',
  down: 'ALTER TABLE foo ...;',
});
```

Every migration requires a query for *up* and *down* migrations. `up` is executed when the migration is created. `down` is executed when the migration is destroyed.

A full example including creating bucket, database, workgroup and permissions can be found in the [test directory](https://github.com/udondan/cdk-db-migration/blob/master/test/lib/index.ts).

## Notes

**No modifications**: The construct will refuse to update any existing migration, because this is not how migrations work. Add another migration or first delete the migration, then add the modified statement.

**Dependencies**: Since migrations (might) depend on one another, make sure to set dependencies where required. In CDK you usually add dependencies like this:

```typescript
const m1 = new Migration.Athena(this, 'M1', {...});
const m2 = new Migration.Athena(this, 'M2', {...});
m2.node.addDependency(m1);
```

Since dependencies are a very common pattern for migrations, a migration also accepts dependencies directly:

```typescript
const m1 = new Migration.Athena(this, 'M1', {...});
const m2 = new Migration.Athena(this, 'M2', {
  dependsOn: m1,
  ...
});
```

**Permissions**: The Lambda function which runs the migrations, is not authorized to do anything at all, because the required permissions are very custom to the use case (database, workgroup, S3 location, KMS etc). Instead of giving too wide permissions by default, none are given at all. The construct exposes the IAM role and you need to grant the required permissions.

**Best solution for your use case?**: While the construct is capable of managing the state of a database over time, have a good thought if you really want to do this with CDK/CloudFormation. CloudFormation can ony handle up to 500 resources in a stack, so this (minus all the other resources in your stack) is going to be your hard limit of migrations. Migrations are executed by a Lambda function. Since the maximum execution time of a Lambda function is 15 minutes, migrations cannot exceed this limit.

   [AWS CDK]: https://aws.amazon.com/cdk/
   [custom CloudFormation resource]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-custom-resources.html
   [npm]: https://www.npmjs.com/package/cdk-db-migration
   [PyPI]: https://pypi.org/project/cdk-db-migration/
   [NuGet]: https://www.nuget.org/packages/CDK.DB.Migration/
   [docs]: https://awscdk.io/packages/cdk-db-migration@1.0.0
   [source]: https://github.com/udondan/cdk-db-migration
   [license]: https://github.com/udondan/cdk-db-migration/blob/master/LICENSE
