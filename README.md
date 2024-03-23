# CDK DB Migration

[![Source](https://img.shields.io/badge/Source-GitHub-blue?logo=github)][source]
[![Test](https://github.com/udondan/cdk-db-migration/workflows/Test/badge.svg)](https://github.com/udondan/cdk-db-migration/actions?query=workflow%3ATest)
[![GitHub](https://img.shields.io/github/license/udondan/cdk-db-migration)][license]
[![Docs](https://img.shields.io/badge/Construct%20Hub-cdk--db--migration-orange)][docs]

[![npm package](https://img.shields.io/npm/v/cdk-db-migration?color=brightgreen)][npm]
[![PyPI package](https://img.shields.io/pypi/v/cdk-db-migration?color=brightgreen)][PyPI]

![Downloads](https://img.shields.io/badge/-DOWNLOADS:-brightgreen?color=gray)
[![npm](https://img.shields.io/npm/dt/cdk-db-migration?label=npm&color=blueviolet)][npm]
[![PyPI](https://img.shields.io/pypi/dm/cdk-db-migration?label=pypi&color=blueviolet)][PyPI]

[AWS CDK] L3 construct for managing DB migrations. Currently implemented DBMS:

- Athena

I created this construct because [CloudFormations Glue Table](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-glue-table.html) doesn't support `TBLPROPERTIES`. I needed an alternative to create a table. Since creating a table is a DB migration, I created a migration construct instead of a simple table construct, which would be hard to impossible to update.

## Installation

This package has peer dependencies, which need to be installed along in the expected version.

For TypeScript/NodeJS, add these to your `dependencies` in `package.json`. For Python, add these to your `requirements.txt`:

- cdk-db-migration
- aws-cdk-lib (^2.0.0)
- constructs (^10.0.0)

## CDK compatibility

- Version 2.x is compatible with the CDK v2.
- Version 1.x is compatible with the CDK v1. There won't be regular updates for this.

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

Every migration requires a query for _up_ and _down_ migrations. `up` is executed when the migration is created. `down` is executed when the migration is destroyed.

A full example including creating bucket, database, workgroup and permissions can be found in the [test directory](https://github.com/udondan/cdk-db-migration/blob/main/test/lib/index.ts).

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
   [npm]: https://www.npmjs.com/package/cdk-db-migration
   [PyPI]: https://pypi.org/project/cdk-db-migration/
   [docs]: https://constructs.dev/packages/cdk-db-migration
   [source]: https://github.com/udondan/cdk-db-migration
   [license]: https://github.com/udondan/cdk-db-migration/blob/main/LICENSE
