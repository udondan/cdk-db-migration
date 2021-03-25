import { LambdaEvent, StandardLogger } from 'aws-cloudformation-custom-resource';
import { Callback, Context } from 'aws-lambda';

import { Athena } from './athena';

const logger = new StandardLogger();

export const handler = function (
  event: LambdaEvent = {},
  context: Context,
  callback: Callback
) {
  logger.debug('Environment:', JSON.stringify(process.env, null, 2));

  switch (
    (event.ResourceType as string).replace(/^Custom::DB-Migration-/, '')
  ) {
    case 'Athena': {
      Athena(event, context, callback, logger);
      break;
    }
    default: {
      callback(`Unhandled resource type: ${event.ResourceType}`);
      break;
    }
  }
};
