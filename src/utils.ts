import * as Sentry from '@sentry/node';
declare global {
  var sentryTracedInstance: any;
}
export const registerSentryInstance = (sentryInstance: typeof Sentry) => {
  global.sentryTracedInstance = sentryInstance;
};

export const getSentryInstance = (): typeof Sentry => {
  return global.sentryTracedInstance;
};
