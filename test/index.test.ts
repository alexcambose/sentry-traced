import { add, multiply } from '../';

describe('math functions', () => {
  test('adds two numbers', () => {
    expect(add(42, 3)).toBe(45);
  });

  test('multiplies three numbers', () => {
    expect(multiply(1, 2, 3)).toBe(6);
  });
});
