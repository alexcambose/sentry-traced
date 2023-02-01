import { SentryTraced, SentryParam } from 'sentry-traced';
import { waitFor } from '../utils';

export class MainService {
  constructor() {
    console.log('MainService constructor');
  }

  // @AttachToAllClassDecorator('aa')
  @SentryTraced()
  public async doSomething(param1?: string, @SentryParam param2?: string) {
    await waitFor(100);
  }
}
