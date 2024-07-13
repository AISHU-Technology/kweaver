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
declare module '@/assets/font/lineIconfont.js';
declare module '@/assets/font/colorIconfont.js';
declare module '@/assets/font/twotoneIconfont.js';
declare module '@/assets/font/menuIconfont.js';

type KwOmit<T, K extends keyof T> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};
