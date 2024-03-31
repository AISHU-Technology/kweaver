import { getRandomString, getRuleString } from '../getRandomString';

describe('getRandomString', () => {
  test('getRandomString', () => {
    expect(getRandomString(10).length).toBe(10);
    expect(getRandomString(12).length).toBe(12);
  });
  test('getRuleString', () => {
    expect(getRuleString('11111111111111111111111112', true)).toBe('12');
    expect(getRuleString('1111111111111111111111111112', false)).toBe('12');
  });
});
