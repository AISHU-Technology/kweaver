import { ConfigProvider } from 'antd';
import { updateCSS } from './dynamicCSS';
import { antdTheme, antdCssMap, adTheme, adCssMap, createVariables } from './themeVariable';

const ANTD_KEY = Object.keys(antdTheme); // 可修改antd的变量key值

/**
 * 取出可修改antd的特殊变量
 * @param {Object} variables 样式变量
 */
const getCorrectVariables = variables => {
  return ANTD_KEY.reduce((res, key) => {
    variables[key] && (res[key] = variables[key]);

    return res;
  }, {});
};

/**
 * 不传参则表示初始化KWeaver的css变量
 * @param {Object || undefined} variables 样式变量 { primaryColor: 'red' }
 */
const generateTheme = variables => {
  // 更新KWeaver颜色
  const cssObj = createVariables(variables);
  const cssList = Object.entries(cssObj).map(([key, value]) => `${key}: ${value};`);

  updateCSS(`:root {
    ${cssList.join('\n')}
  }`);

  if (!variables) return;

  // 更新antd颜色
  const correctVariables = getCorrectVariables(variables);

  ConfigProvider.config({
    theme: { ...correctVariables }
  });
};

export { generateTheme, antdTheme, antdCssMap, adTheme, adCssMap };
