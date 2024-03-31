import formatQueryString from '../formatQueryString';

describe('formatQueryString', () => {
  test('formatQueryString', () => {
    expect(formatQueryString([]).length).toBe(0);
    expect(formatQueryString({})).toBe('');
    expect(formatQueryString({ a: '这是一个a' })).toBe('?a=%E8%BF%99%E6%98%AF%E4%B8%80%E4%B8%AAa');
  });
});
