import getLabelFromShowLabels from '../getLabelFromShowLabels';

describe('getLabelFromShowLabels', () => {
  test('hexToRgba', () => {
    const items = [
      { value: 'aaaaaaa', isChecked: true },
      { value: 'bbbbbbb', isChecked: true }
    ];
    expect(getLabelFromShowLabels(items)).toBe('aaaaaaa\nbbbbbbb');
    expect(getLabelFromShowLabels()).toBe('');
  });
});
