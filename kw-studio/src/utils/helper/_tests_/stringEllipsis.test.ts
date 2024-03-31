import stringEllipsis from '../stringEllipsis';

describe('stringEllipsis', () => {
  test('stringEllipsis', () => {
    expect(stringEllipsis('abcdefghijklmnopq', 10)).toBe('abcdefghij...');
  });
});
