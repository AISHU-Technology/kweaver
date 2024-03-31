import hexToRgba from '../hexToRgba';

describe('hexToRgba', () => {
  test('hexToRgba', () => {
    expect(hexToRgba('rgba(184, 224, 255, 0.1)', 0.3)).toBe('rgba(184, 224, 255,0.3)');
    expect(hexToRgba('#b8e', 0.3)).toBe('');
    expect(hexToRgba('#b8e0ff', 0.3)).toBe('rgba(184, 224, 255, 0.3)');
  });
});
