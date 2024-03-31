declare module '*.png';
declare module '*.jpg';
declare module '*.svg';
declare module '*.js';
declare module 'uuid';
declare module 'store';
declare module 'numeral';
declare module 'crypto-js';
declare module 'markdown-it';
declare module 'react-dom/client';
declare module 'xml-but-prettier';
declare module 'react-test-renderer';
declare module 'react-copy-to-clipboard';
declare module 'react-draggable';
declare module 'react-intl-universal';
declare module '@/assets/graphIcons/iconfont.js';
declare module '@/assets/graphIconsMore/iconfont.js';

// Encapsulation omit: Solve the problem of omit losing types
type AdOmit<T, K extends keyof T> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};
