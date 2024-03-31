import Cookie, { CookieAttributes } from 'js-cookie';
import _ from 'lodash';

const prefixCookie = 'ad.'; // cookie的键的前缀

/**
 * 自动为ad的cookie添加前缀
 */
const kwCookie = {
  // 设置token
  set: (key: string, value: string, options: CookieAttributes = {}) => {
    Cookie.set(`${prefixCookie}${key}`, value, options);
  },
  // 获取token
  get: (key: string) => Cookie.get(`${prefixCookie}${key}`),
  // 移除token
  remove: (key: string, options: CookieAttributes = {}) => {
    Cookie.remove(`${prefixCookie}${key}`, options);
  }
};

export { kwCookie };
