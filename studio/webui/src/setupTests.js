import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import intl from 'react-intl-universal';
import locales from '@/locales';
import 'react-app-polyfill/jsdom';
import '@/vendors/canvasMock';

// 默认简体中文
intl.init({
  currentLocale: 'zh-CN',
  locales
});

// 全局定义 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: jest.fn(query => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

configure({ adapter: new Adapter() });
