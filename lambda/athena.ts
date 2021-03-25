import { CustomResource, Event, LambdaEvent, StandardLogger } from 'aws-cloudformation-custom-resource';
import { Callback, Context } from 'aws-lambda';
import AWS = require('aws-sdk');

const athena = new AWS.Athena();

let log: StandardLogger;

export function Athena(
  event: LambdaEvent,
  context: Context,
  callback: Callback,
  logger: StandardLogger
) {
  log = logger;

  new CustomResource(context, callback, logger)
    .onCreate(Create)
    .onUpdate(Update)
    .onDelete(Delete)
    .handle(event);
}

function Create(event: Event): Promise<Event> {
  event.setPhysicalResourceId(event.LogicalResourceId);
  return runQuery(
    event.ResourceProperties.Up,
    event.ResourceProperties.WorkGroup
  );
}

function Update(event: Event): Promise<Event> {
  event.setPhysicalResourceId(event.LogicalResourceId);
  return new Promise(async function (resolve, reject) {
    reject(Error('A migration cannot be modified!'));
  });
}

function Delete(event: any): Promise<Event> {
  event.setPhysicalResourceId(event.LogicalResourceId);
  return runQuery(
    event.ResourceProperties.Down,
    event.ResourceProperties.WorkGroup
  );
}

function runQuery(query: string, workGroup: string): Promise<Event> {
  return new Promise(async function (resolve, reject) {
    console.log('Executing query...');
    const params: AWS.Athena.StartQueryExecutionInput = {
      QueryString: query,
      WorkGroup: workGroup,
    };
    athena.startQueryExecution(
      params,
      function (err: AWS.AWSError, data: AWS.Athena.StartQueryExecutionOutput) {
        if (err) return reject(err);
        waitForResult(data.QueryExecutionId!)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
            reject(err);
          });
      }
    );
  });
}

function waitForResult(query: AWS.Athena.QueryExecutionId): Promise<Event> {
  return new Promise(function (resolve, reject) {
    const check = setInterval(function () {
      console.log('Pulling query status...');

      const params: AWS.Athena.GetQueryExecutionInput = {
        QueryExecutionId: query,
      };

      athena.getQueryExecution(params, function (err, data) {
        if (err) return reject(err);

        const status = data.QueryExecution?.Status?.State;
        if (['RUNNING', 'QUEUED'].includes(status)) {
          console.log('Status is running. Waiting...');
          return;
        }

        console.log(data);
        clearInterval(check);

        if (status == 'SUCCEEDED') {
          resolve(data as any);
        } else {
          reject(Error(data.QueryExecution.Status.StateChangeReason));
        }
      });
    }, 500);
  });
}
