import getBrowserType from '../getBrowserType';

describe('getBrowserType', () => {
  test('getBrowserType', () => {
    let userAgent = 'Opera';
    expect(getBrowserType(userAgent)).toBe('Opera');

    userAgent = 'Trident rv:11.0';
    expect(getBrowserType(userAgent)).toBe('IE11');

    userAgent = 'compatible MSIE 6.0;';
    expect(getBrowserType(userAgent)).toBe('IE');

    userAgent = 'compatible MSIE 7.0;';
    expect(getBrowserType(userAgent)).toBe('IE7');

    userAgent = 'compatible MSIE 8.0;';
    expect(getBrowserType(userAgent)).toBe('IE8');

    userAgent = 'compatible MSIE 9.0;';
    expect(getBrowserType(userAgent)).toBe('IE9');

    userAgent = 'compatible MSIE 10.0;';
    expect(getBrowserType(userAgent)).toBe('IE10');

    userAgent = 'Edge';
    expect(getBrowserType(userAgent)).toBe('Edge');

    userAgent = 'Firefox';
    expect(getBrowserType(userAgent)).toBe('Firefox');

    userAgent = 'Safari';
    expect(getBrowserType(userAgent)).toBe('Safari');

    userAgent = 'Chrome Safari';
    expect(getBrowserType(userAgent)).toBe('Chrome');

    userAgent = 'UBrowser';
    expect(getBrowserType(userAgent)).toBe('UC');

    userAgent = 'QQBrowser';
    expect(getBrowserType(userAgent)).toBe('QQ');

    userAgent = 'XX';
    expect(getBrowserType(userAgent)).toBe('');
  });
});
