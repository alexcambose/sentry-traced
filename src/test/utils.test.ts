import { generateSpanContext } from '../utils';

describe('utils', () => {
  describe('generateSpanContext', () => {
    it('correctly generates context for just method name', () => {
      expect(
        generateSpanContext({
          methodName: 'testMethod',
        }),
      ).toEqual({
        op: 'testMethod()',
        description: 'testMethod() call',
        descriptionNoArguments: 'testMethod() call',
        data: { args: undefined },
      });
    });
    it('correctly generates context for just class name', () => {
      expect(
        generateSpanContext({
          className: 'testClass',
        }),
      ).toEqual({
        op: 'testClass()',
        description: 'testClass() call',
        descriptionNoArguments: 'testClass() call',
        data: { args: undefined },
      });
    });
    it('correctly generates context for class name and method name without parameters', () => {
      expect(
        generateSpanContext({
          className: 'testClass',
          methodName: 'testMethod',
        }),
      ).toEqual({
        op: 'testClass.testMethod()',
        description: 'testClass.testMethod() call',
        descriptionNoArguments: 'testClass.testMethod() call',
        data: { args: undefined },
      });
    });
    it('correctly generates context for class name and method name with parameters', () => {
      expect(
        generateSpanContext({
          className: 'testClass',
          methodName: 'testMethod',
          args: [1, 'two', true],
        }),
      ).toEqual({
        op: 'testClass.testMethod(_,_,_)',
        description: 'testClass.testMethod(_,_,_) call',
        descriptionNoArguments: 'testClass.testMethod() call',
        data: { args: [1, 'two', true] },
      });
    });
    it('correctly generates context for class name and method name with parameters and Sentry traced params', () => {
      expect(
        generateSpanContext({
          className: 'testClass',
          methodName: 'testMethod',
          args: [1, 'two', true],
          sentryParams: [0, 2],
        }),
      ).toEqual({
        op: 'testClass.testMethod(1,_,true)',
        description: 'testClass.testMethod(1,_,true) call',
        descriptionNoArguments: 'testClass.testMethod() call',
        data: { args: [1, 'two', true] },
      });
    });
  });
});
