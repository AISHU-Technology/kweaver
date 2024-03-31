/**
 * 判断是否是火狐浏览器
 */
export const isFF = typeof navigator === 'object' && /Firefox/i.test(navigator.userAgent);
