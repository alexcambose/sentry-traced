import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';
import express from 'express';
import '@sentry/tracing'; // don't forget to import the tracing package as well
import { registerSentryInstance } from 'sentry-traced';
import { MainService } from './services/MainService';
import { waitFor } from './utils';

const app = express();
const port = 3000;
/**
 * Initialize Sentry with dsn and integrations
 */
Sentry.init({
  dsn: 'https://c66a2c25e42a4914a78354af798c3174@o1045421.ingest.sentry.io/6719428',
  integrations: [new Integrations.Express()],
  tracesSampleRate: 1.0,
});
/**
 * Register Sentry instance to be used in decorators.
 * Related to 'sentry-traced' library
 */
registerSentryInstance(Sentry);

/**
 * Initialize main service (dummy service to test decorators)
 */
const mainService = new MainService();

app.get('/', async (req, res) => {
  // const transaction = Sentry.startTransaction({ name: 'testtx' });
  await waitFor(100);
  await mainService.doSomething('someParam', 'someParam2');
  // transaction.finish();
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening  http://localhost:${port}`);
});
