import { ConfigProvider } from 'antd';

import getAntdGlobalConfig from './getAntdGlobalConfig';

const switchTheme = (them: string) => {
  // 通过修改html的theme属性，匹配/src/them/them_**.less全局属性变量
  if (!them) return document.documentElement.removeAttribute('theme');
  document.documentElement.setAttribute('theme', them);

  const antdGlobalConfig = getAntdGlobalConfig();
  ConfigProvider.config({ theme: { ...antdGlobalConfig } });
};

export default switchTheme;
