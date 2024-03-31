import { rgbaToHex } from '../rgbaToHex';

describe('rgbaToHex', () => {
  test('formatQueryString', () => {
    expect(rgbaToHex('rgba(255, 180, 0, 0.4)')).toBe('#ffb40066');
    expect(rgbaToHex({ r: 255, g: 180, b: 0, a: 0.4 })).toBe('#ffb40066');
  });
});
