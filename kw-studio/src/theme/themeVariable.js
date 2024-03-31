/**
 * 主题变量
 */

const { inputToRGB } = require('@ctrl/tinycolor');
const { generate } = require('@ant-design/colors');

// antd支持修改的5个颜色变量
const antdTheme = {
  primaryColor: '#126ee3', // 全局主色
  successColor: '#52c41a', // 成功色
  warningColor: '#faad14', // 警告色
  errorColor: '#f5222d', // 错误色
  infoColor: '#126ee3' // 信息提示色(暂时与主色一致)
};

// antd css变量名映射
const antdCssMap = {
  primaryColor: '--ant-primary-color',
  successColor: '--ant-success-color',
  warningColor: '--ant-warning-color',
  errorColor: '--ant-error-color',
  infoColor: '--ant-info-color'
};

// KWeaver自定义变量
const adTheme = {
  // 主色
  primaryColor: '#126ee3', // 全局主色
  successColor: '#52c41a', // 成功色
  warningColor: '#faad14', // 警告色
  errorColor: '#f5222d', // 错误色
  infoColor: '#126ee3', // 信息提示色(暂时与主色一致)
  disabledColor: 'rgba(0, 0, 0, 0.25)', // 失效色

  // 字体相关
  // linkColor: '#3461ec', // 超链接颜色色rgba(52,97,236,.75)
  linkColor: 'rgba(52,97,236,.8)',
  linkHoverColor: '#3461ec', // 超链接悬停色
  headingColor: 'rgba(0, 0, 0, 0.85)', // 标题色
  textColor: 'rgba(0, 0, 0, 0.65)', // 主文本色
  textColorSecondary: 'rgba(0, 0, 0, 0.45)', // 次文本色

  // 其他
  borderRadiusBase: '3px', // 组件/浮层圆角
  borderColorBase: 'rgba(0, 0, 0, 0.15)', // 边框色
  boxShadowBase:
    '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', // 浮层阴影
  lineColor: 'rgba(0, 0, 0, 0.06)', // 分割线颜色
  hoverBgColor: '#f5f5f5', // 悬停背景色, rgba(0, 0, 0, 0.04)
  selectBgColor: '#f1f7fe' // 选中背景色, 主色的6%透明度
};

// KWeaver css变量名映射
const adCssMap = {
  // 主色初始化的时候会自动生成rgb变量值, 例如 --kw-primary-color-rgb: 18, 110, 227
  // primaryColor会计算和antd相同的hover值, --kw-primary-color-hover: #3a8ff0
  primaryColor: '--kw-primary-color', // 全局主色
  successColor: '--kw-success-color', // 成功色
  warningColor: '--kw-warning-color', // 警告色
  errorColor: '--kw-error-color', // 错误色
  infoColor: '--kw-info-color', // 信息提示色(暂时与主色一致)
  disabledColor: '--kw-disabled-color', // 失效色

  // 字体相关
  linkColor: '--kw-link-color', // 链接色
  linkHoverColor: '--kw-link-hover-color', // 链接悬停色
  headingColor: '--kw-heading-color', // 标题色
  textColor: '--kw-text-color', // 主文本色
  textColorSecondary: '--kw-text-color-secondary', // 次文本色

  // 其他
  borderRadiusBase: '--kw-border-radius-base', // 组件/浮层圆角
  borderColorBase: '--kw-border-color-base', // 边框色
  boxShadowBase: '--kw-box-shadow-base', // 浮层阴影
  lineColor: '--kw-line-color', // 分割线颜色
  hoverBgColor: '--kw-hover-bg-color', // 悬停背景色, rgba(0, 0, 0, 0.04)
  selectBgColor: '--kw-select-bg-color' // 选中背景色, 主色的6%透明度
};

/**
 * 生成rgb通道值, rgb(1, 2, 3) => 1, 2, 3
 * @param {String} colorVal 颜色值
 */
const createRgbValue = colorVal => {
  const { ok, r, g, b } = inputToRGB(colorVal);

  return ok && `${r}, ${g}, ${b}`;
};

/**
 * 计算一些特殊的变量：rgb值, 主色hover值
 * @param {Object} variables 修改的变量
 */
const otherVariables = variables => {
  const cssObj = {};

  // 主色添加rgb三色通道值变量
  Object.keys(antdTheme).forEach(key => {
    const cssValue = adTheme[key];
    const cssKey = adCssMap[key];
    const rgb = createRgbValue(cssValue);

    rgb && (cssObj[`${cssKey}-rgb`] = rgb);
  });

  // 计算并添加primary hover
  const primaryColor = inputToRGB(variables.primaryColor);
  const colorPalettes = generate(primaryColor);
  const primaryHover = colorPalettes[4];

  cssObj[`${adCssMap.primaryColor}-hover`] = primaryHover;

  return cssObj;
};

/**
 * 构造css变量对象, { primaryColor: red } --> { --kw-primary-color: red }
 * @param {Object || undefined} variables 修改的变量, 不传参则初始化所有
 */
const createVariables = variables => {
  const newVariables = Object.assign({}, adTheme, variables || {});
  const cssObj = {};
  const otherObj = otherVariables(newVariables);

  Object.entries(newVariables).forEach(item => (cssObj[adCssMap[item[0]]] = item[1]));

  return Object.assign(cssObj, otherObj);
};

// webpack.config.js中需要使用, 故使用commonJS导出
// 此文件中不能使用es6解构语法, 否则import时出错
module.exports = { createVariables, antdTheme, antdCssMap, adTheme, adCssMap };
