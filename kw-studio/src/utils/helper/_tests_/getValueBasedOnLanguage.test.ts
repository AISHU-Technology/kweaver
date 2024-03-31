import getValueBasedOnLanguage from '../getValueBasedOnLanguage';

describe('formatQueryString', () => {
  test('formatQueryString', () => {
    const data = {
      'zh-CN': '现在是中文'
    };
    expect(getValueBasedOnLanguage(data, 'zh-CN')).toBe('现在是中文');
  });
});
