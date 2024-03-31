import getPositionBaseTwoPoint from '../getPositionBaseTwoPoint';

describe('getPositionBaseTwoPoint', () => {
  test('getPositionBaseTwoPoint', () => {
    expect(getPositionBaseTwoPoint({ x: 10, y: 10 }, { x: 10, y: 30 }, 100).x).toBe(10);
    expect(getPositionBaseTwoPoint({ x: 100, y: 56 }, { x: 30, y: 56 }, 100).x).toBe(0);
    expect(getPositionBaseTwoPoint({ x: 10, y: 10 }, { x: 230, y: 230 }, 100).x).toBe(80.71067811865476);
  });
});
