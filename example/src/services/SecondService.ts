import { SentryTraced, SentryParam } from 'sentry-traced';

/**
 * Second example class to test the decorators
 */
export class SecondService {
  @SentryTraced()
  async myMethod(
    @SentryParam param1: number,
    @SentryParam param2: string,
    param3: string,
  ) {
    console.log('Second service -> myMethod called', {
      param1,
      param2,
      param3,
    });
  }
}
