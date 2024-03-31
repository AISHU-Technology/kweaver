import constructListFromKeysAndLabel from '../constructListFromKeysAndLabel';

describe('constructListFromKeysAndLabel', () => {
  test('constructListFromKeysAndLabel', () => {
    expect(constructListFromKeysAndLabel({} as [], { a: '这是一个a' }).length).toBe(0);
    expect(constructListFromKeysAndLabel(['a'], { a: '这是一个a' })[0].label).toBe('这是一个a');
  });
});
