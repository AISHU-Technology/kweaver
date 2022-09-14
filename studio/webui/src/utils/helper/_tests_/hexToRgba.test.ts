import hexToRgba from '../hexToRgba';

describe('hexToRgba', () => {
  test('hexToRgba', () => {
    expect(hexToRgba('#b8e0ff', 0.3)).toBe('rgba(184, 224, 255, 0.3)');
  });
});
