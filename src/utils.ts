import * as Sentry from '@sentry/node';
import { extractTraceparentData } from '@sentry/tracing';
import { SpanContext } from '@sentry/types';
import { InternalMetadata, SentryTracedParams } from './types';

declare global {
  // eslint-disable-next-line no-var
  var sentryTracedInstance: any;
}

export const registerSentryInstance = (sentryInstance: typeof Sentry) => {
  global.sentryTracedInstance = sentryInstance;
};

export const getSentryInstance = (): typeof Sentry => {
  return global.sentryTracedInstance;
};

/**
 * This function is used to check if a value is a promise
 * @param value Value to check if it's a promise
 * @returns Returns true if the value is a promise
 */
export const isPromise = (value: any): boolean => {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  );
};

/**
 * The data the Sentry needs to generate a span context
 * @param metadata Internal metadata used to generate the span context. It contains the class name, method name, arguments and the sentry params.
 * @param options Options related to the span context (eg. methodName, className)
 * @returns
 */
export const generateSpanContext = (
  metadata: InternalMetadata,
  options?: SentryTracedParams,
) => {
  const { className, methodName, args, sentryParams } = metadata;
  // this generates a string as a list of arguments, for example (1,2,3) or (1,_,3)
  let argumentsStringList = '()';
  if (args) {
    argumentsStringList = `(${new Array(args.length)
      .fill(0)
      .map((_, index) =>
        (sentryParams || []).includes(index) ? args[index] : '_',
      )
      .join(',')})`;
  }
  let functionNameString = `unknown`;
  if (!methodName && className) {
    functionNameString = className;
  } else if (!className && methodName) {
    functionNameString = methodName;
  } else {
    functionNameString = `${className}.${methodName}`;
  }

  const op = options?.op || `${functionNameString}${argumentsStringList}`;
  const description =
    options?.description || `${functionNameString}${argumentsStringList} call`;
  const descriptionNoArguments =
    options?.description || `${functionNameString}() call`;

  return {
    op,
    description,
    descriptionNoArguments,
    data: { args },
  };
};

/**
 * This function is used to connect a method annotated with `@SentryTraced` to an existing transaction based on the traceparentData string
 * See https://docs.sentry.io/platforms/node/performance/connect-services/
 * @param traceparentData The traceparentData string
 * @param overrides Options to pass to the transaction
 * @returns Returns a function that will wrap the original function that needs to be called
 * @example
 * ```typescript
 * const result = withTracing(sentryTrace)(secondService.myMethod)('some param1', 'some param2');
 * ```
 */
export const withTracing =
  (traceparentData?: string, overrides: SpanContext = {}) =>
  <T extends (...args: never[]) => any>(functionToCall: T) =>
  async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    if (!traceparentData) {
      return await functionToCall.bind(functionToCall)(...args);
    }
    // The request headers sent by your upstream service to your backend.
    const extractedTraceparentData = extractTraceparentData(traceparentData);
    const className = functionToCall.constructor.name;
    const methodName = functionToCall.name;
    const { op, description } = generateSpanContext({
      className,
      methodName,
      args,
    });
    const transaction = Sentry.startTransaction({
      op,
      description,
      name: `${op} transaction`,
      ...extractedTraceparentData,
      ...overrides,
    });
    Sentry.configureScope((scope) => {
      scope.setSpan(transaction);
    });
    const result = await functionToCall.bind(functionToCall)(...args);
    transaction.finish();
    return result;
  };
