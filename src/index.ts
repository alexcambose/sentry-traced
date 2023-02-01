import { SentryTraced, SentryParam } from './SentryTraced';
import { registerSentryInstance } from './utils';

export { registerSentryInstance, SentryTraced, SentryParam };

export function AttachToAllClassDecorator<T>(someParam: string) {
  return function (target: new (...params: any[]) => T) {
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
      // maybe blacklist methods here
      let descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);
      if (descriptor) {
        SentryTraced()(target, key, descriptor);
        Object.defineProperty(target.prototype, key, descriptor);
      }
    }
  };
}
