import React from 'react';
import Cookie from 'js-cookie';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';

import App from '@/pages/router';
import store from '@/reduxConfig/store';
import setPrototypeOf from 'setprototypeof';

import 'moment/locale/zh-cn';
import zhCN from 'antd/lib/locale/zh_CN';
import enUS from 'antd/lib/locale/en_US';

import '@/global.less';
import 'antd/dist/antd.variable.min.css';
import '@/assets/style/common.less';
import '@/theme/overwriteAntd.less';

Object.setPrototypeOf = setPrototypeOf;

ReactDOM.render(
  <Provider store={store}>
    <ConfigProvider locale={Cookie.get('anyDataLang') === 'zh-CN' ? zhCN : enUS}>
      <App />
    </ConfigProvider>
  </Provider>,
  document.getElementById('root')
);
