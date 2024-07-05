import { configure } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import intl from 'react-intl-universal';
import 'react-app-polyfill/jsdom';
import '@uiw/react-codemirror';
import '@uiw/codemirror-themes';
import '@codemirror/lang-json';
import 'jest-canvas-mock';

import locales from '@/locales';
import '@/tests/mockModules';
import '@/tests/window';

intl.init({
  currentLocale: 'zh-CN',
  locales
});

configure({ adapter: new Adapter() });
