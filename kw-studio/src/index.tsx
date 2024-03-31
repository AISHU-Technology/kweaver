import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';

import App from '@/pages/router';
import store from '@/reduxConfig/store';
import setPrototypeOf from 'setprototypeof';

import 'moment/locale/zh-cn';
import zhCN from 'antd/lib/locale/zh_CN';
import enUS from 'antd/lib/locale/en_US';

import 'antd/dist/antd.variable.min.css';
import '@/assets/style/common.less';
import '@/theme/overwriteAntd.less';
import '@/global.less';
import '@/assets/graphIcons/iconfont.css';
import '@/assets/graphIconsMore/iconfont.css';
import { kwCookie } from '@/utils/handleFunction';

Object.setPrototypeOf = setPrototypeOf;
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <ConfigProvider locale={kwCookie.get('kwLang') === 'zh-CN' ? zhCN : enUS}>
      <App />
    </ConfigProvider>
  </Provider>
);
