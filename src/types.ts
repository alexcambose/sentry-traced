export type SentryTracedParamsIndexes = number[];

/**
 * Internal metadata used to generate the span context.
 */
export type SentryTracedParams = {
  description?: string;
  op?: string;
};
export type InternalMetadata = {
  /**
   * The name of the method
   */
  methodName?: string;
  /**
   * The name of the class
   */
  className?: string;
  /**
   * The arguments of the method, as an array
   */
  args?: unknown[];
  /**
   * The index of the arguments that should be included in the transaction name?
   */
  sentryParams?: SentryTracedParamsIndexes;
};
