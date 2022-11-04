import _ from 'lodash';

interface TempKeyValueObject {
  [key: string]: any;
}

const ANTD_ROOT_CSS = {
  primaryColor: '--ad-primary-color',
  successColor: '--ad-success-color',
  warningColor: '--ad-warning-color',
  errorColor: '--ad-error-color',
  infoColor: '--ad-info-color'
};
/**
 * 通过antd可配置属性key和root:{}中的变量key映射，获取全局属性变量然后构建ConfigProvider的配置对象
 * @returns Object
 */
const getAntdGlobalConfig = () => {
  const keys = _.keys(ANTD_ROOT_CSS);
  const antdGlobalConfig: TempKeyValueObject = {};

  _.forEach(keys, key => {
    const cssRooVariableKey = (ANTD_ROOT_CSS as any)[key];
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssRooVariableKey);
    if (value) antdGlobalConfig[key] = value;
  });

  return antdGlobalConfig;
};

export default getAntdGlobalConfig;
