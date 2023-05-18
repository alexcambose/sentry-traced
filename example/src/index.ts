import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';
import express from 'express';
import '@sentry/tracing'; // don't forget to import the tracing package as well
import { registerSentryInstance, withTracing } from 'sentry-traced';
import { MainService, SecondService } from './services/MainService';
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
const secondService = new SecondService();

app.get('/', async (req, res) => {
  await waitFor(100);
  await mainService.myMethod(123, 'param2', 'param3');
  res.send('Hello World!');
});

app.get('/other-endpoint', async (req, res) => {
  await waitFor(100);
  const sentryTrace = req.headers['sentry-trace'] as string;
  const result = withTracing(sentryTrace, {
    op: 'otherEndpoint',
    description: 'transaction from other endpoint',
  })(secondService.myMethod)(123, 'param2', 'param3');

  res.send(result);
});

app.listen(port, () => {
  console.log(`Example app listening  http://localhost:${port}`);
});
