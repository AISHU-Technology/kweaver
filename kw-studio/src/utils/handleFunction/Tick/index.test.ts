import { tick } from './index';

describe('Tick', () => {
  test('tick', () => {
    const a = 1;
    tick(() => {});
    expect(a).toBe(1);
  });
});
