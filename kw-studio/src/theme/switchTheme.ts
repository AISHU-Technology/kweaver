import { ConfigProvider } from 'antd';

import getAntdGlobalConfig from './getAntdGlobalConfig';

const switchTheme = (them: string) => {
  if (!them) return document.documentElement.removeAttribute('theme');
  document.documentElement.setAttribute('theme', them);

  const antdGlobalConfig = getAntdGlobalConfig();
  ConfigProvider.config({ theme: { ...antdGlobalConfig } });
};

export default switchTheme;
