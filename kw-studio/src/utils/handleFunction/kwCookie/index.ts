import Cookie, { CookieAttributes } from 'js-cookie';

const prefixCookie = 'kw.';

/**
 * 自动为ad的cookie添加前缀
 */
const kwCookie = {
  set: (key: string, value: string, options: CookieAttributes = {}) => {
    Cookie.set(`${prefixCookie}${key}`, value, options);
  },
  get: (key: string) => Cookie.get(`${prefixCookie}${key}`),
  remove: (key: string, options: CookieAttributes = {}) => {
    Cookie.remove(`${prefixCookie}${key}`, options);
  }
};

export { kwCookie };
