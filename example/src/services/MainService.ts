import { SentryTraced, SentryParam } from 'sentry-traced';
import fetch from 'node-fetch';
import * as Sentry from '@sentry/node';

export class MainService {
  @SentryTraced()
  async myMethod(
    @SentryParam param1: number,
    @SentryParam param2: string,
      param3: string,
  ) {
    console.log('my method called', { param1, param2, param3 });
    const span = Sentry.getCurrentHub().getScope()?.getSpan();
    const result = await fetch('http://localhost:3000/other-endpoint', {
      headers: {
        'sentry-trace': span!.toTraceparent(),
      },
    });
    console.log(await result.text());
  }
}

export class SecondService {
  @SentryTraced()
  async myMethod(
    @SentryParam param1: number,
    @SentryParam param2: string,
      param3: string,
  ) {
    console.log('my second service method called', { param1, param2, param3 });
  }
}
