import Sentry from '@sentry/node';
import { getSentryInstance } from './utils';
import utils from 'util';
import 'reflect-metadata';
const sentryParamsMetadataKey = Symbol('sentryParams');
type SentryTracedParamsIndex = number[];

interface ISentryTracedParams {
  description?: string;
  op?: string;
}
interface IInternalMetadata {
  methodName: string;
  className: string;
  args: unknown[];
  sentryParams: SentryTracedParamsIndex;
}

const generateSpanContext = (
  metadata: IInternalMetadata,
  options?: ISentryTracedParams,
) => {
  const { className, methodName, args, sentryParams } = metadata;
  const argumentsStringList = `(${new Array(args.length)
    .fill(0)
    .map((_, index) => (sentryParams.includes(index) ? args[index] : '_'))
    .join(',')})`;
  const op = options?.op || `${className}#${methodName}${argumentsStringList}`;
  const description =
    options?.description ||
    `${className}#${methodName}${argumentsStringList} call`;
  const descriptionNoArguments =
    options?.description || `${className}#${methodName}() call`;
  return {
    op,
    description,
    descriptionNoArguments,
    data: { args },
  };
};
/**
 * Decorator that automatically generates calls the sentry tracing related functions and registers nested aware metrics
 * @param options Decorator options related to sentry tracing namings
 * @returns Decorated function
 */
export const SentryTraced = (options?: ISentryTracedParams) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const className = this.constructor.name;
      const methodName = propertyKey;
      const sentryClient = getSentryInstance();
      const sentryParams: SentryTracedParamsIndex = Reflect.getOwnMetadata(
        sentryParamsMetadataKey,
        target,
        methodName,
      );
      const intermediaryFunction = async () => {
        if (!sentryClient || !sentryClient.getCurrentHub()) {
          throw new Error(`Sentry client not set`);
        }
        const spanContext = generateSpanContext(
          { className, methodName, args, sentryParams },
          options,
        );
        const scope = sentryClient.getCurrentHub().getScope();

        // get the current context, the order matters, we want to get
        // - the current span if it exists, this allows nesting if the function call is a child of a child or a leaf
        // - the current transaction if it exists, this can only happen if the function call is a child of the root node
        const contextTransaction = scope?.getSpan() || scope?.getTransaction();
        // we try to get the context span or transaction and if it doesn't exist we create a new transaction
        const transactionOrSpan =
          contextTransaction ||
          sentryClient.startTransaction({
            ...spanContext,
            name: spanContext.descriptionNoArguments,
          });
        // start a nested child of the current transaction/span
        const newSpan = transactionOrSpan?.startChild(spanContext);
        // set the context of the newly create span/transaction
        sentryClient.configureScope((scope) => {
          scope.setSpan(newSpan);
        });
        // call the function -> if the function is also annotated it will basically "recursively" create spans inside the parent span based on the context that we set
        const resultPromise = original.call(this, ...args);
        // there's a possibility that the function is a normal function or an async one so we need to check for both cases
        if (utils.types.isPromise(resultPromise)) {
          // in case the function is a promise we need to resolve it and also reset the current context to the parent node for the next sibling function call
          return resultPromise.then((e: any) => {
            sentryClient.configureScope((scope) => {
              scope.setSpan(transactionOrSpan);
            });
            newSpan?.finish();
            if (!contextTransaction) {
              transactionOrSpan.finish();
            }
            return e;
          });
        } else {
          // same for a normal function but we just do it before returning the value
          Sentry.configureScope((scope) => {
            scope.setSpan(transactionOrSpan);
          });
          if (!contextTransaction) {
            transactionOrSpan.finish();
          }

          return resultPromise;
        }
      };
      return intermediaryFunction();
    };
  };
};

/**
 *
 */
export function SentryParam(
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number,
) {
  const sentryParams: SentryTracedParamsIndex =
    Reflect.getOwnMetadata(sentryParamsMetadataKey, target, propertyKey) || [];
  sentryParams.push(parameterIndex);
  Reflect.defineMetadata(
    sentryParamsMetadataKey,
    sentryParams,
    target,
    propertyKey,
  );
}
