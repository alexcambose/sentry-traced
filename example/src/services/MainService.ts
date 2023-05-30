import { SentryTraced, SentryParam } from 'sentry-traced';
import fetch from 'node-fetch';
import * as Sentry from '@sentry/node';

/**
 * Example class to test the decorators
 */
export class MainService {
  @SentryTraced()
  async myMethod() {
    console.log('called myMethod');
    await this.myMethodChild1();
    await this.myMethodChild2();
  }

  @SentryTraced()
  private async myMethodChild1() {
    console.log('-- called myMethodChild1');
    await this.myMethodChild1Child1();
    await this.myMethodChild1Child2();
  }
  @SentryTraced()
  private async myMethodChild2() {
    console.log('-- called myMethodChild2');
    await this.myMethodChild2Child1();
  }
  @SentryTraced()
  private async myMethodChild1Child1() {
    console.log('---- called myMethodChild1Child1');
  }
  @SentryTraced()
  private async myMethodChild1Child2() {
    console.log('---- called myMethodChild1Child2');
  }
  @SentryTraced()
  private async myMethodChild2Child1() {
    console.log('---- called myMethodChild2Child1');
  }

  @SentryTraced()
  async exampleDistributedTracing() {
    const span = Sentry.getCurrentHub().getScope()?.getSpan();
    const result = await fetch('http://localhost:3000/other-endpoint', {
      headers: {
        'sentry-trace': span!.toTraceparent(),
      },
    });
    return await result.text();
  }
}
